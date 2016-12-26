import {DomEvent, ListenableDom} from 'external/gs_tools/src/event';
import {inject} from 'external/gs_tools/src/inject';
import {Validate} from 'external/gs_tools/src/valid';
import {
    bind,
    BooleanParser,
    customElement,
    DomBridge,
    EnumParser,
    handle,
    StringParser} from 'external/gs_tools/src/webc';

import {BaseThemedElement} from 'external/gs_ui/src/common';
import {Event} from 'external/gs_ui/src/const';
import {RouteService} from 'external/gs_ui/src/routing';
import {ThemeService} from 'external/gs_ui/src/theming';

import {Asset, AssetTypes} from '../data/asset';
import {AssetCollection} from '../data/asset-collection';
import {RouteFactoryService} from '../routing/route-factory-service';
import {Views} from '../routing/views';

import {AssetTypeItem} from './asset-type-item';


/**
 * Generates the menu to pick asset types.
 *
 * @param document The owner document.
 * @param instance Pointer to instance of the view.
 * @return The newly generated element.
 */
export function assetTypeMenuGenerator(document: Document, instance: CreateAssetView): Element {
  let element = document.createElement('pa-asset-type-item');
  let listenable = ListenableDom.of(element);
  instance.addDisposable(
      listenable,
      listenable.on(DomEvent.CLICK, instance.onTypeClicked, instance));
  return element;
}

/**
 * Sets the data to the generated menu element.
 *
 * @param data The data to set.
 * @param element The element to set the data to.
 */
export function assetTypeMenuDataSetter(data: AssetTypes, element: Element): void {
  element.setAttribute('pa-data', EnumParser<AssetTypes>(AssetTypes).stringify(data));
}

/**
 * The main landing view of the app.
 */
@customElement({
  dependencies: [AssetCollection, AssetTypeItem],
  tag: 'pa-create-asset-view',
  templateKey: 'src/project/create-asset-view',
})
export class CreateAssetView extends BaseThemedElement {
  @bind('gs-text-input').attribute('gs-value', StringParser)
  private readonly nameValueBridge_: DomBridge<string>;

  @bind('gs-basic-button#createButton').attribute('disabled', BooleanParser)
  private readonly createButtonDisabledBridge_: DomBridge<boolean>;

  @bind('#assetTypeMenu')
      .childrenElements<AssetTypes>(assetTypeMenuGenerator, assetTypeMenuDataSetter)
  private readonly assetTypeMenuBridge_: DomBridge<AssetTypes[]>;

  @bind('#assetType').innerText()
  private readonly assetTypeBridge_: DomBridge<string>;

  private readonly assetCollection_: AssetCollection;
  private readonly routeFactoryService_: RouteFactoryService;
  private readonly routeService_: RouteService<Views>;
  private assetType_: AssetTypes | null;

  /**
   * @param themeService
   * @param projectCollection
   */
  constructor(
      @inject('theming.ThemeService') themeService: ThemeService,
      @inject('pa.data.AssetCollection') assetCollection: AssetCollection,
      @inject('pa.routing.RouteFactoryService') routeFactoryService: RouteFactoryService,
      @inject('gs.routing.RouteService') routeService: RouteService<Views>) {
    super(themeService);
    this.assetType_ = null;
    this.createButtonDisabledBridge_ = DomBridge.of<boolean>(true);
    this.nameValueBridge_ = DomBridge.of<string>();
    this.assetCollection_ = assetCollection;
    this.assetTypeBridge_ = DomBridge.of<string>();
    this.assetTypeMenuBridge_ = DomBridge.of<number[]>();
    this.routeFactoryService_ = routeFactoryService;
    this.routeService_ = routeService;
  }

  /**
   * @return Project ID of the view, or null if there is none.
   */
  private getProjectId_(): string | null {
    let params = this.routeService_.getParams(this.routeFactoryService_.createAsset());
    return params === null ? null : params.projectId;
  }

  /**
   * Resets the form.
   */
  private reset_(): void {
    this.setAssetType_(null);
    this.nameValueBridge_.set('');
  }

  /**
   * Sets the type of the asset.
   * @param type Type of the asset to set.
   */
  private setAssetType_(type: AssetTypes | null): void {
    this.assetType_ = type;
    if (type === null) {
      this.assetTypeBridge_.set('Select a type ...');
    } else {
      this.assetTypeBridge_.set(Asset.renderType(type));
    }
    this.verifyInput_();
  }

  /**
   * Verifies the input values.
   */
  private verifyInput_(): void {
    this.createButtonDisabledBridge_.set(!this.nameValueBridge_.get() || this.assetType_ === null);
  }

  /**
   * Handles event when the cancel button is clicked.
   */
  @handle('#cancelButton').event(Event.ACTION)
  protected onCancelAction_(): void {
    let projectId = this.getProjectId_();
    if (projectId !== null) {
      this.reset_();
      this.routeService_.goTo(this.routeFactoryService_.project(), {projectId: projectId});
    }
  }

  /**
   * Handles event when the name field has changed.
   */
  @handle('gs-text-input').attributeChange('gs-value', StringParser)
  protected onNameChange_(): void {
    this.verifyInput_();
  }

  /**
   * Handles event when the submit button is clicked.
   *
   * @return Promise that will be resolved when all handling logic have completed.
   */
  @handle('#createButton').event(Event.ACTION)
  protected onSubmitAction_(): Promise<void> {
    const assetName = this.nameValueBridge_.get();
    if (!assetName) {
      throw Validate.fail('Project name is not set');
    }

    const assetType = this.assetType_;
    if (assetType === null) {
      throw Validate.fail('Asset type is not set');
    }

    const projectId = this.getProjectId_();
    if (projectId === null) {
      return Promise.resolve();
    }

    return this.assetCollection_
        .reserveId(projectId)
        .then((id: string) => {
          let asset = new Asset(id, projectId);
          asset.setName(assetName);
          asset.setType(assetType);
          return this.assetCollection_.update(asset, projectId);
        })
        .then(() => {
          this.reset_();
          this.routeService_
              .goTo(this.routeFactoryService_.project(), {projectId: projectId});
        });
  }

  /**
   * @override
   */
  onCreated(element: HTMLElement): void {
    super.onCreated(element);
    this.assetTypeMenuBridge_.set([AssetTypes.CARD]);
  }

  /**
   * Handles when a type menu item is clicked.
   * @param event The click event.
   */
  onTypeClicked(event: Event): void {
    let target: Element = <Element> event.target;
    let type = EnumParser<AssetTypes>(AssetTypes).parse(target.getAttribute('pa-data'));
    this.setAssetType_(type);
  }
}
