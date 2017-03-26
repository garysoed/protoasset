import { atomic } from 'external/gs_tools/src/async';
import { Arrays } from 'external/gs_tools/src/collection';
import { DisposableFunction } from 'external/gs_tools/src/dispose';
import { DomEvent, ListenableDom } from 'external/gs_tools/src/event';
import { inject } from 'external/gs_tools/src/inject';
import { BaseIdGenerator, SimpleIdGenerator } from 'external/gs_tools/src/random';
import {
  bind,
  BooleanParser,
  ChildElementDataHelper,
  customElement,
  DomHook,
  handle,
  StringParser } from 'external/gs_tools/src/webc';

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
    listenable.on(DomEvent.CLICK, instance.onArgClick, instance);
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
    resultEl.innerHTML = Arrays
        .of(data.result.split('\n'))
        .map((line: string) => {
          return line.replace(/ /g, '&nbsp;');
        })
        .map((line: string) => {
          return `<p>${line}</p>`;
        })
        .asArray()
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
  dependencies: [
    HelperItem,
    SampleDataPicker,
    SampleDataService,
    TemplateCompilerService,
  ],
  tag: 'pa-asset-helper-view',
  templateKey: 'src/asset/helper-view',
})
export class HelperView extends BaseThemedElement {
  @bind('#args').childrenElements<string>(ARG_DATA_HELPER, 0, 1)
  readonly argElementsHook_: DomHook<string[]>;

  @bind('#argInput').attribute('gs-value', StringParser)
  readonly argInputHook_: DomHook<string>;

  @bind('#bodyInput').attribute('gs-value', StringParser)
  readonly bodyInputHook_: DomHook<string>;

  @bind('#console').childrenElements<ConsoleEntry>(CONSOLE_ENTRY_DATA_HELPER)
  readonly consoleEntryHook_: DomHook<ConsoleEntry[]>;

  @bind('#consoleInput').attribute('gs-value', StringParser)
  readonly consoleInputHook_: DomHook<string>;

  @bind('#helpers').childrenElements<HelperIdParams>(HELPER_ITEM_DATA_HELPER)
  readonly helperItemsHook_: DomHook<HelperIdParams[]>;

  @bind('#name').innerText()
  readonly nameHook_: DomHook<string>;

  @bind('#sampleDataPicker').attribute('asset-id', StringParser)
  readonly sampleDataPickerAssetIdHook_: DomHook<string>;

  @bind('#sampleDataPicker').attribute('project-id', StringParser)
  readonly sampleDataPickerProjectIdHook_: DomHook<string>;

  private readonly assetCollection_: AssetCollection;
  private readonly helperIdGenerator_: BaseIdGenerator;
  private readonly routeFactoryService_: RouteFactoryService;
  private readonly routeService_: RouteService<Views>;
  private readonly sampleDataService_: SampleDataService;
  private readonly templateCompilerService_: TemplateCompilerService;

  private assetUpdateDeregister_: DisposableFunction | null;
  private helperUpdateDeregister_: DisposableFunction | null;

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
    const existingHelperIds = Arrays
        .of(asset.getAllHelpers())
        .map((helper: Helper) => {
          return helper.getId();
        })
        .asArray();
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

  @handle(null).attributeChange('gs-view-active', BooleanParser)
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

  @handle('#argInput').attributeChange('gs-value', StringParser)
  protected onArgInputValueChange_(newValue: string | null): void {
    if (newValue === null) {
      return;
    }

    const commaIndex = newValue.indexOf(',');
    if (commaIndex >= 0) {
      const existingArgs = this.argElementsHook_.get() || [];
      const newArgs = Arrays
          .of(newValue.split(','))
          .map((arg: string) => {
            return arg.trim();
          })
          .filter((arg: string) => {
            return arg.length > 0;
          })
          .asArray();

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

    const otherHelpers = Arrays
        .of(asset.getAllHelpers())
        .filter((value: Helper) => {
          return value.getId() !== helper.getId();
        })
        .asArray();
    const helperIdParams = Arrays
        .of([helper])
        .addAllArray(otherHelpers)
        .map((helper: Helper) => {
          return {
            assetId: asset.getId(),
            helperId: helper.getId(),
            projectId: asset.getProjectId(),
          };
        })
        .asIterable();
    this.helperItemsHook_.set(Arrays.fromIterable(helperIdParams).asArray());
  }

  @handle('#args').childListChange()
  @handle('#bodyInput').attributeChange('gs-value', StringParser)
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
  };

  @handle('#createButton').event(DomEvent.CLICK)
  protected async onCreateButtonClick_(): Promise<void> {
    const asset = await this.getAsset_();
    if (asset === null) {
      return;
    }

    await this.createHelper_(asset);
  };

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

    const element = this.getElement();
    if (element === null) {
      return;
    }
    const containerEl = element.getEventTarget().shadowRoot.querySelector('#consoleContainer');
    containerEl.scrollTop = containerEl.scrollHeight;
  };

  /**
   * Handles when the helper was updated.
   * @param helper The updated helper.
   */
  protected onHelperChanged_(helper: Helper): void {
    this.nameHook_.set(helper.getName());
    this.argElementsHook_.set(helper.getArgs());
    this.bodyInputHook_.set(helper.getBody());
  };

  /**
   * Handles event when the route is changed.
   */
  private onRouteChanged_(): void {
    this.onActiveChange_(this.routeService_.getParams(this.routeFactoryService_.helper()) !== null);
  };

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

    this.assetUpdateDeregister_ = asset.on(
        DataEvents.CHANGED,
        this.onAssetChanged_.bind(this, asset),
        this);
    this.onAssetChanged_(asset);
  };

  /**
   * Updates using the given helper.
   * @param helper The helper that should be applied.
   */
  private updateHelper_(helper: Helper): void {
    if (this.helperUpdateDeregister_ !== null) {
      this.helperUpdateDeregister_.dispose();
      this.helperUpdateDeregister_ = null;
    }

    this.helperUpdateDeregister_ = helper.on(
        DataEvents.CHANGED,
        this.onHelperChanged_.bind(this, helper),
        this);
    this.onHelperChanged_(helper);
  };

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
  };

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

    const removedIndex = Arrays
        .fromItemList(target.parentElement.children)
        .findIndex((value: Element) => {
          return value === target;
        });

    if (removedIndex === null) {
      return;
    }

    args.splice(removedIndex, 1);
    this.argElementsHook_.set(args);
  }

  /**
   * @override
   */
  onCreated(element: HTMLElement): void {
    super.onCreated(element);
    this.addDisposable(this.routeService_.on(
        RouteServiceEvents.CHANGED,
        this.onRouteChanged_,
        this));
    this.onRouteChanged_();
  };
}
