import {Arrays} from 'external/gs_tools/src/collection';
import {DisposableFunction} from 'external/gs_tools/src/dispose';
import {DomEvent, ListenableDom} from 'external/gs_tools/src/event';
import {inject} from 'external/gs_tools/src/inject';
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
import {TemplateCompiler} from '../data/template-compiler';
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

  @bind('#nameInput').attribute('gs-value', StringParser)
  private readonly nameInputBridge_: DomBridge<string>;

  @bind('#console').childrenElements<ConsoleEntry>(consoleEntryGenerator, consoleEntryDataSetter)
  private readonly consoleEntryBridge_: DomBridge<ConsoleEntry[]>;

  private readonly assetCollection_: AssetCollection;
  private readonly routeFactoryService_: RouteFactoryService;
  private readonly routeService_: RouteService<Views>;
  private readonly templateCompilerService_: TemplateCompilerService;

  private assetUpdateDeregister_: DisposableFunction | null;

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
    this.helperItemsBridge_ = DomBridge.of<HelperIdParams[]>();
    this.nameInputBridge_ = DomBridge.of<string>();
    this.routeFactoryService_ = routeFactoryService;
    this.routeService_ = routeService;
    this.templateCompilerService_ = templateCompilerService;
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
  private getHelper_(): Promise<Helper | null> {
    const params = this.routeService_
        .getParams<HelperIdParams>(this.routeFactoryService_.helper());
    if (params === null) {
      return Promise.resolve(null);
    }

    return this
        .getAsset_()
        .then((asset: Asset | null) => {
          if (asset === null) {
            return null;
          }

          return asset.getHelper(params.helperId);
        });
  }

  @handle(null).attributeChange('gs-view-active', BooleanParser)
  protected onActiveChange_(isActive: boolean | null): Promise<void> {
    if (!!isActive) {
      return this.getAsset_()
          .then((asset: Asset | null) => {
            if (this.assetUpdateDeregister_ !== null) {
              this.assetUpdateDeregister_.dispose();
              this.assetUpdateDeregister_ = null;
            }

            if (asset !== null) {
              this.assetUpdateDeregister_ = asset.on(
                  DataEvents.CHANGED,
                  this.updateAsset_.bind(this, asset),
                  this);
              this.updateAsset_(asset);
            }
          });
    } else {
      return Promise.resolve();
    }
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

  @handle('#args').childListChange()
  @handle('#bodyInput').attributeChange('gs-value', StringParser)
  @handle('#nameInput').attributeChange('gs-value', StringParser)
  protected onChanges_(): Promise<void> {
    const args = this.argElementsBridge_.get();
    const name = this.nameInputBridge_.get();
    const body = this.bodyInputBridge_.get();

    if (args === null || name === null || body === null) {
      return Promise.resolve();
    }

    return Promise
        .all([
          this.getHelper_(),
          this.getAsset_(),
        ])
        .then(([helper, asset]: [Helper | null, Asset | null]) => {
          if (helper === null || asset === null) {
            return;
          }

          helper.setArgs(args);
          helper.setBody(body);
          helper.setName(name);

          asset.setHelper(helper.getId(), helper);
          return this.assetCollection_.update(asset);
        });
  }

  @handle('#executeButton').event(DomEvent.CLICK)
  protected onExecuteButtonClick_(): Promise<void> {
    const consoleValue = this.consoleInputBridge_.get();
    if (consoleValue === null) {
      return Promise.resolve();
    }

    return this.getAsset_()
        .then((asset: Asset | null) => {
          if (asset === null) {
            return Promise.resolve(null);
          }
          return this.templateCompilerService_.create(asset);
        })
        .then((compiler: TemplateCompiler | null) => {
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
        });
  }

  /**
   * Handles event when the route is changed.
   */
  private onRouteChanged_(): void {
    this.onActiveChange_(this.routeService_.getParams(this.routeFactoryService_.helper()) !== null);
  }

  /**
   * Updates using the given asset.
   */
  private updateAsset_(asset: Asset): Promise<void> {
    return this
        .getHelper_()
        .then((helper: Helper | null) => {
          if (helper === null) {
            return;
          }

          this.argElementsBridge_.set(helper.getArgs());
          this.bodyInputBridge_.set(helper.getBody());
          this.nameInputBridge_.set(helper.getName());

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
        });
  }

  /**
   * @override
   */
  disposeInternal(): void {
    if (this.assetUpdateDeregister_ !== null) {
      this.assetUpdateDeregister_.dispose();
    }

    super.disposeInternal();
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
  }
}
