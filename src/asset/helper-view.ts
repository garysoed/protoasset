import { atomic } from 'external/gs_tools/src/async';
import { DisposableFunction } from 'external/gs_tools/src/dispose';
import { DomEvent, ListenableDom } from 'external/gs_tools/src/event';
import { ImmutableList, ImmutableSet } from 'external/gs_tools/src/immutable';
import { inject } from 'external/gs_tools/src/inject';
import { StringParser } from 'external/gs_tools/src/parse';
import { BaseIdGenerator, SimpleIdGenerator } from 'external/gs_tools/src/random';
import {
  ChildElementDataHelper,
  customElement,
  DomHook,
  handle,
  hook } from 'external/gs_tools/src/webc';

import { BaseThemedElement } from 'external/gs_ui/src/common';
import { RouteService, RouteServiceEvents } from 'external/gs_ui/src/routing';
import { ThemeService } from 'external/gs_ui/src/theming';

import { HelperItem } from '../asset/helper-item';
import { SampleDataPicker } from '../common/sample-data-picker';
import { SampleDataService } from '../common/sample-data-service';
import { Asset } from '../data/asset';
import { AssetCollection } from '../data/asset-collection';
import { DataEvents } from '../data/data-events';
import { Helper } from '../data/helper';
import { TemplateCompilerService } from '../data/template-compiler-service';
import { RouteFactoryService } from '../routing/route-factory-service';
import { Views } from '../routing/views';


type HelperIdParams = {assetId: string, helperId: string, projectId: string };
type ConsoleEntry = {command: string, isError: boolean, result: string};


export const ARG_DATA_HELPER: ChildElementDataHelper<string> = {
  /**
   * @override
   */
  create(document: Document, instance: HelperView): Element {
    const element = document.createElement('div');
    const listenable = ListenableDom.of(element);
    instance.addDisposable(listenable);
    instance.listenTo(listenable, DomEvent.CLICK, instance.onArgClick);
    return element;
  },

  /**
   * @override
   */
  get(element: Element): string | null {
    return element.textContent;
  },

  /**
   * @override
   */
  set(label: string, element: Element): void {
    element.textContent = label;
  },
};


export const CONSOLE_ENTRY_DATA_HELPER: ChildElementDataHelper<ConsoleEntry> = {
  /**
   * @override
   */
  create(document: Document): Element {
    const root = document.createElement('div');
    root.classList.add('consoleEntry');
    const command = document.createElement('div');
    command.classList.add('gs-theme-invert');
    const result = document.createElement('div');
    root.appendChild(command);
    root.appendChild(result);
    return root;
  },

  /**
   * @override
   */
  get(element: Element): ConsoleEntry | null {
    const command = element.children.item(0).textContent;
    const isError = element.children.item(1).classList.contains('error');
    const result = element.getAttribute('pa-result');
    if (command === null || result === null) {
      return null;
    }
    return {command, isError, result};
  },

  /**
   * @override
   */
  set(data: ConsoleEntry, element: Element): void {
    element.setAttribute('pa-result', data.result);
    element.children.item(0).textContent = data.command;

    const resultEl = element.children.item(1);
    resultEl.innerHTML = ImmutableList
        .of(data.result.split('\n'))
        .map((line: string) => {
          return line.replace(/ /g, '&nbsp;');
        })
        .map((line: string) => {
          return `<p>${line}</p>`;
        })
        .toArray()
        .join('');
    resultEl.classList.toggle('error', data.isError);
  },
};


export const HELPER_ITEM_DATA_HELPER: ChildElementDataHelper<HelperIdParams> = {
  /**
   * @override
   */
  create(document: Document): Element {
    return document.createElement('pa-asset-helper-item');
  },

  /**
   * @override
   */
  get(element: Element): HelperIdParams | null {
    const helperId = element.getAttribute('helper-id');
    const assetId = element.getAttribute('asset-id');
    const projectId = element.getAttribute('project-id');

    if (assetId === null || helperId === null || projectId === null) {
      return null;
    }

    return {assetId, helperId, projectId};
  },

  /**
   * @override
   */
  set(helperIdParams: HelperIdParams, element: Element): void {
    element.setAttribute('helper-id', helperIdParams.helperId);
    element.setAttribute('asset-id', helperIdParams.assetId);
    element.setAttribute('project-id', helperIdParams.projectId);
  },
};


/**
 * Helper view
 */
@customElement({
  dependencies: ImmutableSet.of([
    HelperItem,
    SampleDataPicker,
    SampleDataService,
    TemplateCompilerService,
  ]),
  tag: 'pa-asset-helper-view',
  templateKey: 'src/asset/helper-view',
})
export class HelperView extends BaseThemedElement {
  @hook('#args').childrenElements<string>(ARG_DATA_HELPER, 0, 1)
  readonly argElementsHook_: DomHook<string[]>;

  @hook('#argInput').attribute('gs-value', StringParser)
  readonly argInputHook_: DomHook<string>;

  @hook('#bodyInput').attribute('gs-value', StringParser)
  readonly bodyInputHook_: DomHook<string>;

  @hook('#consoleContainer').element(HTMLElement)
  readonly consoleContainerHook_: DomHook<HTMLElement>;

  @hook('#console').childrenElements<ConsoleEntry>(CONSOLE_ENTRY_DATA_HELPER)
  readonly consoleEntryHook_: DomHook<ConsoleEntry[]>;

  @hook('#consoleInput').attribute('gs-value', StringParser)
  readonly consoleInputHook_: DomHook<string>;

  @hook('#helpers').childrenElements<HelperIdParams>(HELPER_ITEM_DATA_HELPER)
  readonly helperItemsHook_: DomHook<HelperIdParams[]>;

  @hook('#name').innerText()
  readonly nameHook_: DomHook<string>;

  @hook('#sampleDataPicker').attribute('asset-id', StringParser)
  readonly sampleDataPickerAssetIdHook_: DomHook<string>;

  @hook('#sampleDataPicker').attribute('project-id', StringParser)
  readonly sampleDataPickerProjectIdHook_: DomHook<string>;

  private readonly assetCollection_: AssetCollection;
  private assetUpdateDeregister_: DisposableFunction | null;
  private readonly helperIdGenerator_: BaseIdGenerator;
  private helperUpdateDeregister_: DisposableFunction | null;
  private readonly routeFactoryService_: RouteFactoryService;
  private readonly routeService_: RouteService<Views>;
  private readonly sampleDataService_: SampleDataService;
  private readonly templateCompilerService_: TemplateCompilerService;

  constructor(
      @inject('pa.data.AssetCollection') assetCollection: AssetCollection,
      @inject('pa.routing.RouteFactoryService') routeFactoryService: RouteFactoryService,
      @inject('gs.routing.RouteService') routeService: RouteService<Views>,
      @inject('pa.common.SampleDataService') sampleDataService: SampleDataService,
      @inject('pa.data.TemplateCompilerService') templateCompilerService: TemplateCompilerService,
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);
    this.argElementsHook_ = DomHook.of<string[]>();
    this.argInputHook_ = DomHook.of<string>();
    this.assetCollection_ = assetCollection;
    this.assetUpdateDeregister_ = null;
    this.bodyInputHook_ = DomHook.of<string>();
    this.consoleContainerHook_ = DomHook.of<HTMLElement>();
    this.consoleEntryHook_ = DomHook.of<ConsoleEntry[]>();
    this.consoleInputHook_ = DomHook.of<string>();
    this.helperIdGenerator_ = new SimpleIdGenerator();
    this.helperItemsHook_ = DomHook.of<HelperIdParams[]>();
    this.helperUpdateDeregister_ = null;
    this.nameHook_ = DomHook.of<string>();
    this.routeFactoryService_ = routeFactoryService;
    this.routeService_ = routeService;
    this.sampleDataPickerAssetIdHook_ = DomHook.of<string>();
    this.sampleDataPickerProjectIdHook_ = DomHook.of<string>();
    this.sampleDataService_ = sampleDataService;
    this.templateCompilerService_ = templateCompilerService;
  }

  /**
   * Creates a new helper object.
   */
  private async createHelper_(asset: Asset): Promise<void> {
    const existingHelperIds = ImmutableList
        .of(asset.getAllHelpers())
        .map((helper: Helper) => {
          return helper.getId();
        })
        .toArray();
    const newHelperId = this.helperIdGenerator_.generate(existingHelperIds);
    const helper = Helper.of(newHelperId, `helper_${newHelperId}`);
    asset.setHelper(newHelperId, helper);

    const [helperId] = await Promise.all([newHelperId, this.assetCollection_.update(asset)]);
    this.routeService_.goTo<{assetId: string, helperId: string, projectId: string}>(
        this.routeFactoryService_.helper(),
        {
          assetId: asset.getId(),
          helperId: helperId,
          projectId: asset.getProjectId(),
        });
  }

  /**
   * @override
   */
  disposeInternal(): void {
    if (this.assetUpdateDeregister_ !== null) {
      this.assetUpdateDeregister_.dispose();
    }

    if (this.helperUpdateDeregister_ !== null) {
      this.helperUpdateDeregister_.dispose();
    }

    super.disposeInternal();
  }

  /**
   * @return Promise that will be resolved with the asset for the current view, or null if it cannot
   *     be determined.
   */
  private getAsset_(): Promise<Asset | null> {
    const params = this.routeService_
        .getParams<HelperIdParams>(this.routeFactoryService_.helper());
    if (params === null) {
      return Promise.resolve(null);
    }

    return this.assetCollection_.get(params.projectId, params.assetId);
  }

  /**
   * @return Promise that will be resolved with the helper for the current view, or null if it
   *     cannot be determined.
   */
  private async getHelper_(): Promise<Helper | null> {
    const params = this.routeService_
        .getParams<HelperIdParams>(this.routeFactoryService_.helper());
    if (params === null) {
      return Promise.resolve(null);
    }

    const asset = await this.getAsset_();
    if (asset === null) {
      return null;
    }

    return asset.getHelper(params.helperId);
  }

  @handle(null).attributeChange('gs-view-active')
  @atomic()
  protected async onActiveChange_(isActive: boolean | null): Promise<void> {
    if (this.assetUpdateDeregister_ !== null) {
      this.assetUpdateDeregister_.dispose();
      this.assetUpdateDeregister_ = null;
    }
    if (!isActive) {
      return;
    }

    const asset = await this.getAsset_();
    if (asset === null) {
      this.routeService_.goTo(this.routeFactoryService_.landing(), {});
      return;
    }
    this.sampleDataPickerAssetIdHook_.set(asset.getId());
    this.sampleDataPickerProjectIdHook_.set(asset.getProjectId());
    this.updateAsset_(asset);
  }

  /**
   * Handles event when the arg element is clicked.
   * @param event The event object.
   */
  onArgClick(event: Event): void {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const args = this.argElementsHook_.get();
    if (args === null) {
      return;
    }

    const parentEl = target.parentElement;
    if (parentEl === null) {
      return;
    }

    const removedIndex = ImmutableList
        .of(parentEl.children)
        .findKey((value: Element) => {
          return value === target;
        });

    if (removedIndex === null) {
      return;
    }

    args.splice(removedIndex, 1);
    this.argElementsHook_.set(args);
  }

  @handle('#argInput').attributeChange('gs-value')
  protected onArgInputValueChange_(newValue: string | null): void {
    if (newValue === null) {
      return;
    }

    const commaIndex = newValue.indexOf(',');
    if (commaIndex >= 0) {
      const existingArgs = this.argElementsHook_.get() || [];
      const newArgs = ImmutableList
          .of(newValue.split(','))
          .map((arg: string) => {
            return arg.trim();
          })
          .filter((arg: string) => {
            return arg.length > 0;
          })
          .toArray();

      this.argElementsHook_.set(existingArgs.concat(newArgs));
      this.argInputHook_.delete();
    }
  }

  /**
   * Handles when the asset was updated.
   * @param asset The updated asset;
   */
  protected async onAssetChanged_(asset: Asset): Promise<void> {
    const helper = await this.getHelper_();
    if (helper === null) {
      // Check for an existing helper.
      const helpers = asset.getAllHelpers();
      if (helpers.length <= 0) {
        await this.createHelper_(asset);
      } else {
        this.routeService_.goTo(this.routeFactoryService_.helper(), {
          assetId: asset.getId(),
          helperId: helpers[0].getId(),
          projectId: asset.getProjectId(),
        });
      }
      return;
    }

    this.updateHelper_(helper);

    const otherHelpers = ImmutableList
        .of(asset.getAllHelpers())
        .filter((value: Helper) => {
          return value.getId() !== helper.getId();
        })
        .toArray();
    const helperIdParams = ImmutableList
        .of([helper])
        .addAll(ImmutableList.of(otherHelpers))
        .map((helper: Helper) => {
          return {
            assetId: asset.getId(),
            helperId: helper.getId(),
            projectId: asset.getProjectId(),
          };
        });
    this.helperItemsHook_.set(helperIdParams.toArray());
  }

  @handle('#args').childListChange()
  @handle('#bodyInput').attributeChange('gs-value')
  protected async onChanges_(): Promise<void> {
    const args = this.argElementsHook_.get();
    const body = this.bodyInputHook_.get();

    if (args === null || body === null) {
      return;
    }

    const [helper, asset] = await Promise.all([this.getHelper_(), this.getAsset_()]);
    if (helper === null || asset === null) {
      return;
    }

    helper.setArgs(args);
    helper.setBody(body);

    asset.setHelper(helper.getId(), helper);
    await this.assetCollection_.update(asset);
  }

  @handle('#createButton').event(DomEvent.CLICK)
  protected async onCreateButtonClick_(): Promise<void> {
    const asset = await this.getAsset_();
    if (asset === null) {
      return;
    }

    await this.createHelper_(asset);
  }

  /**
   * @override
   */
  onCreated(element: HTMLElement): void {
    super.onCreated(element);
    this.addDisposable(
        this.routeService_.on(RouteServiceEvents.CHANGED, this.onRouteChanged_, this));
    this.onRouteChanged_();
  }

  @handle('#executeButton').event(DomEvent.CLICK)
  protected async onExecuteButtonClick_(): Promise<void> {
    const consoleValue = this.consoleInputHook_.get();
    if (consoleValue === null) {
      return;
    }

    const [asset, rowData] = await Promise.all([
      this.getAsset_(),
      this.sampleDataService_.getRowData(),
    ]);
    if (asset === null || rowData === null) {
      return;
    }

    const compiler = await this.templateCompilerService_.create(asset, rowData);
    if (compiler === null) {
      return;
    }

    let result;
    let isError;
    try {
      result = compiler.compile(consoleValue);
      isError = false;
    } catch (e) {
      if (!(e instanceof Error)) {
        return;
      }
      result = `${e.message}\n\n${e.stack}`;
      isError = true;
    }
    const consoleEntries = this.consoleEntryHook_.get() || [];
    consoleEntries.push({command: consoleValue, isError: isError, result: result});
    this.consoleEntryHook_.set(consoleEntries);

    const containerEl = this.consoleContainerHook_.get();
    if (containerEl === null) {
      throw new Error('Console container element cannot be found');
    }
    containerEl.scrollTop = containerEl.scrollHeight;
  }

  /**
   * Handles when the helper was updated.
   * @param helper The updated helper.
   */
  protected onHelperChanged_(helper: Helper): void {
    this.nameHook_.set(helper.getName());
    this.argElementsHook_.set(helper.getArgs());
    this.bodyInputHook_.set(helper.getBody());
  }
  /**
   * Handles event when the route is changed.
   */
  private onRouteChanged_(): void {
    this.onActiveChange_(this.routeService_.getParams(this.routeFactoryService_.helper()) !== null);
  }

  /**
   * Updates using the given asset.
   * @param asset The asset that should be applied.
   */
  private updateAsset_(asset: Asset): void {
    // Update the asset
    if (this.assetUpdateDeregister_ !== null) {
      this.assetUpdateDeregister_.dispose();
      this.assetUpdateDeregister_ = null;
    }

    this.assetUpdateDeregister_ = this.listenTo(
        asset,
        DataEvents.CHANGED,
        this.onAssetChanged_.bind(this, asset));
    this.onAssetChanged_(asset);
  }

  /**
   * Updates using the given helper.
   * @param helper The helper that should be applied.
   */
  private updateHelper_(helper: Helper): void {
    if (this.helperUpdateDeregister_ !== null) {
      this.helperUpdateDeregister_.dispose();
      this.helperUpdateDeregister_ = null;
    }

    this.helperUpdateDeregister_ = this.listenTo(
        helper,
        DataEvents.CHANGED,
        this.onHelperChanged_.bind(this, helper));
    this.onHelperChanged_(helper);
  }
}
// TODO: Mutable
