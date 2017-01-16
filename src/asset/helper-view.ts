import {Arrays} from 'external/gs_tools/src/collection';
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
import {RouteService} from 'external/gs_ui/src/routing';
import {ThemeService} from 'external/gs_ui/src/theming';

import {Asset} from '../data/asset';
import {AssetCollection} from '../data/asset-collection';
import {Helper} from '../data/helper';
import {RouteFactoryService} from '../routing/route-factory-service';
import {Views} from '../routing/views';


type HelperIdParams = {assetId: string, helperId: string, projectId: string};

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
 * Helper view
 */
@customElement({
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

  @bind('#nameInput').attribute('gs-value', StringParser)
  private readonly nameInputBridge_: DomBridge<string>;

  private readonly assetCollection_: AssetCollection;
  private readonly routeFactoryService_: RouteFactoryService;
  private readonly routeService_: RouteService<Views>;

  constructor(
      @inject('pa.data.AssetCollection') assetCollection: AssetCollection,
      @inject('pa.routing.RouteFactoryService') routeFactoryService: RouteFactoryService,
      @inject('gs.routing.RouteService') routeService: RouteService<Views>,
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);
    this.argElementsBridge_ = DomBridge.of<string[]>();
    this.argInputBridge_ = DomBridge.of<string>();
    this.assetCollection_ = assetCollection;
    this.bodyInputBridge_ = DomBridge.of<string>();
    this.nameInputBridge_ = DomBridge.of<string>();
    this.routeFactoryService_ = routeFactoryService;
    this.routeService_ = routeService;
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

          let helper = asset.getHelpers()[params.helperId];
          return helper || null;
        });
  }

  @handle(null).attributeChange('gs-view-active', BooleanParser)
  protected onActiveChange_(isActive: boolean | null): Promise<void> {
    if (!!isActive) {
      return this.getHelper_()
          .then((helper: Helper | null) => {
            if (helper === null) {
              return;
            }

            this.argElementsBridge_.set(helper.getArgs());
            this.bodyInputBridge_.set(helper.getBody());
            this.nameInputBridge_.set(helper.getName());
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

          let helpers = asset.getHelpers();
          helpers[helper.getId()] = helper;
          asset.setHelpers(helpers);

          return this.assetCollection_.update(asset, asset.getProjectId());
        });
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
}
