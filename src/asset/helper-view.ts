import {Arrays} from 'external/gs_tools/src/collection';
import {DisposableFunction} from 'external/gs_tools/src/dispose';
import {DomEvent, ListenableDom} from 'external/gs_tools/src/event';
import {inject} from 'external/gs_tools/src/inject';
import {IdGenerator, SimpleIdGenerator} from 'external/gs_tools/src/random';
import {
  bind,
  BooleanParser,
  customElement,
  DomBridge,
  handle,
  StringParser} from 'external/gs_tools/src/webc';

import {BaseThemedElement} from 'external/gs_ui/src/common';
import {RouteService, RouteServiceEvents} from 'external/gs_ui/src/routing';
import {ThemeService} from 'external/gs_ui/src/theming';

import {Asset} from '../data/asset';
import {AssetCollection} from '../data/asset-collection';
import {DataEvents} from '../data/data-events';
import {Helper} from '../data/helper';
import {TemplateCompilerService} from '../data/template-compiler-service';
import {RouteFactoryService} from '../routing/route-factory-service';
import {Views} from '../routing/views';

import {HelperItem} from './helper-item';


type HelperIdParams = {assetId: string, helperId: string, projectId: string};
type ConsoleEntry = {command: string, isError: boolean, result: string};

/**
 * Generates a new element to represent a helper's arg.
 * @param document The document that the element belongs to.
 * @param instance Instance of the HelperView.
 * @return The newly created element.
 */
export function argElementGenerator(document: Document, instance: HelperView): Element {
  let element = document.createElement('div');
  let listenable = ListenableDom.of(element);
  instance.addDisposable(listenable);
  listenable.on(DomEvent.CLICK, instance.onArgClick, instance);
  return element;
}

/**
 * Sets the data to the given arg element.
 * @param label The arg label to set.
 * @param element The arg element.
 */
export function argElementDataSetter(label: string, element: Element): void {
  element.textContent = label;
}

/**
 * Generates a new element for the console entry.
 * @param document The document that the element belongs to.
 * @return The newly created element.
 */
export function consoleEntryGenerator(document: Document): Element {
  let root = document.createElement('div');
  root.classList.add('consoleEntry');
  let command = document.createElement('div');
  command.classList.add('gs-theme-invert');
  let result = document.createElement('div');
  root.appendChild(command);
  root.appendChild(result);
  return root;
}

/**
 * Sets the data to the given console entry element.
 * @param data The console entry data.
 * @param element The console entry element.
 */
export function consoleEntryDataSetter(data: ConsoleEntry, element: Element): void {
  element.children.item(0).textContent = data.command;

  let resultEl = element.children.item(1);
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
}

/**
 * Sets the data to the helper item.
 * @param helperIdParams Data to set.
 * @param element The helper item element.
 */
export function helperItemDataSetter(helperIdParams: HelperIdParams, element: Element): void {
  element.setAttribute('helper-id', helperIdParams.helperId);
  element.setAttribute('asset-id', helperIdParams.assetId);
  element.setAttribute('project-id', helperIdParams.projectId);
}

/**
 * Creates a new helper item element.
 * @param document The document that the element belongs to.
 * @return The newly created element.
 */
export function helperItemGenerator(document: Document): Element {
  return document.createElement('pa-asset-helper-item');
}

/**
 * Helper view
 */
@customElement({
  dependencies: [HelperItem, TemplateCompilerService],
  tag: 'pa-asset-helper-view',
  templateKey: 'src/asset/helper-view',
})
export class HelperView extends BaseThemedElement {
  @bind('#args').childrenElements<string>(argElementGenerator, argElementDataSetter, 0)
  private readonly argElementsBridge_: DomBridge<string[]>;

  @bind('#argInput').attribute('gs-value', StringParser)
  private readonly argInputBridge_: DomBridge<string>;

  @bind('#bodyInput').attribute('gs-value', StringParser)
  private readonly bodyInputBridge_: DomBridge<string>;

  @bind('#consoleInput').attribute('gs-value', StringParser)
  private readonly consoleInputBridge_: DomBridge<string>;

  @bind('#helpers').childrenElements<HelperIdParams>(helperItemGenerator, helperItemDataSetter)
  private readonly helperItemsBridge_: DomBridge<HelperIdParams[]>;

  @bind('#name').innerText()
  private readonly nameBridge_: DomBridge<string>;

  @bind('#console').childrenElements<ConsoleEntry>(consoleEntryGenerator, consoleEntryDataSetter)
  private readonly consoleEntryBridge_: DomBridge<ConsoleEntry[]>;

  private readonly assetCollection_: AssetCollection;
  private readonly helperIdGenerator_: IdGenerator;
  private readonly routeFactoryService_: RouteFactoryService;
  private readonly routeService_: RouteService<Views>;
  private readonly templateCompilerService_: TemplateCompilerService;

  private assetUpdateDeregister_: DisposableFunction | null;
  private helperUpdateDeregister_: DisposableFunction | null;

  constructor(
      @inject('pa.data.AssetCollection') assetCollection: AssetCollection,
      @inject('pa.routing.RouteFactoryService') routeFactoryService: RouteFactoryService,
      @inject('gs.routing.RouteService') routeService: RouteService<Views>,
      @inject('pa.data.TemplateCompilerService') templateCompilerService: TemplateCompilerService,
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);
    this.argElementsBridge_ = DomBridge.of<string[]>();
    this.argInputBridge_ = DomBridge.of<string>();
    this.assetCollection_ = assetCollection;
    this.assetUpdateDeregister_ = null;
    this.bodyInputBridge_ = DomBridge.of<string>();
    this.consoleEntryBridge_ = DomBridge.of<ConsoleEntry[]>();
    this.consoleInputBridge_ = DomBridge.of<string>();
    this.helperIdGenerator_ = new SimpleIdGenerator();
    this.helperItemsBridge_ = DomBridge.of<HelperIdParams[]>();
    this.helperUpdateDeregister_ = null;
    this.nameBridge_ = DomBridge.of<string>();
    this.routeFactoryService_ = routeFactoryService;
    this.routeService_ = routeService;
    this.templateCompilerService_ = templateCompilerService;
  }

  /**
   * Creates a new helper object.
   */
  private async createHelper_(asset: Asset): Promise<void> {
    let newHelperId = this.helperIdGenerator_.generate();
    while (asset.getHelper(newHelperId) !== null) {
      newHelperId = this.helperIdGenerator_.resolveConflict(newHelperId);
    }

    let helper = Helper.of(newHelperId, `helper_${newHelperId}`);
    asset.setHelper(newHelperId, helper);

    let [helperId] = await Promise.all([newHelperId, this.assetCollection_.update(asset)]);
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

    let asset = await this.getAsset_();
    if (asset === null) {
      return null;
    }

    return asset.getHelper(params.helperId);
  }

  @handle(null).attributeChange('gs-view-active', BooleanParser)
  protected async onActiveChange_(isActive: boolean | null): Promise<void> {
    if (!isActive) {
      return;
    }
    let asset = await this.getAsset_();
    if (asset === null) {
      this.routeService_.goTo(this.routeFactoryService_.landing(), {});
      return;
    }
    this.updateAsset_(asset);
  }

  @handle('#argInput').attributeChange('gs-value', StringParser)
  protected onArgInputValueChange_(newValue: string | null): void {
    if (newValue === null) {
      return;
    }

    let commaIndex = newValue.indexOf(',');
    if (commaIndex >= 0) {
      let existingArgs = this.argElementsBridge_.get() || [];
      let newArgs = Arrays
          .of(newValue.split(','))
          .map((arg: string) => {
            return arg.trim();
          })
          .filter((arg: string) => {
            return arg.length > 0;
          })
          .asArray();

      this.argElementsBridge_.set(existingArgs.concat(newArgs));
      this.argInputBridge_.delete();
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
      let helpers = asset.getAllHelpers();
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

    let otherHelpers = Arrays
        .of(asset.getAllHelpers())
        .filter((value: Helper) => {
          return value.getId() !== helper.getId();
        })
        .asArray();
    let helperIdParams = Arrays
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
    this.helperItemsBridge_.set(Arrays.fromIterable(helperIdParams).asArray());
  }

  @handle('#args').childListChange()
  @handle('#bodyInput').attributeChange('gs-value', StringParser)
  protected async onChanges_(): Promise<void> {
    const args = this.argElementsBridge_.get();
    const body = this.bodyInputBridge_.get();

    if (args === null || body === null) {
      return;
    }

    let [helper, asset] = await Promise.all([this.getHelper_(), this.getAsset_()]);
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
    let asset = await this.getAsset_();
    if (asset === null) {
      return;
    }

    await this.createHelper_(asset);
  };

  @handle('#executeButton').event(DomEvent.CLICK)
  protected async onExecuteButtonClick_(): Promise<void> {
    const consoleValue = this.consoleInputBridge_.get();
    if (consoleValue === null) {
      return;
    }

    let asset = await this.getAsset_();
    if (asset === null) {
      return;
    }

    let compiler = await this.templateCompilerService_.create(asset);
    if (compiler === null) {
      return;
    }

    let result;
    let isError;
    try {
      result = compiler.compile(consoleValue)();
      isError = false;
    } catch (e) {
      if (!(e instanceof Error)) {
        return;
      }
      result = `${e.message}\n\n${e.stack}`;
      isError = true;
    }
    let consoleEntries = this.consoleEntryBridge_.get() || [];
    consoleEntries.push({command: consoleValue, isError: isError, result: result});
    this.consoleEntryBridge_.set(consoleEntries);

    let element = this.getElement();
    if (element === null) {
      return;
    }
    let containerEl = element.getEventTarget().shadowRoot.querySelector('#consoleContainer');
    containerEl.scrollTop = containerEl.scrollHeight;
  };

  /**
   * Handles when the helper was updated.
   * @param helper The updated helper.
   */
  protected onHelperChanged_(helper: Helper): void {
    this.nameBridge_.set(helper.getName());
    this.argElementsBridge_.set(helper.getArgs());
    this.bodyInputBridge_.set(helper.getBody());
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

    let args = this.argElementsBridge_.get();
    if (args === null) {
      return;
    }

    let removedIndex = Arrays
        .fromItemList(target.parentElement.children)
        .findIndex((value: Element) => {
          return value === target;
        });

    if (removedIndex === null) {
      return;
    }

    args.splice(removedIndex, 1);
    this.argElementsBridge_.set(args);
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
