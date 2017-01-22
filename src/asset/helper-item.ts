import {DisposableFunction} from 'external/gs_tools/src/dispose';
import {DomEvent} from 'external/gs_tools/src/event';
import {inject} from 'external/gs_tools/src/inject';
import {bind, customElement, DomBridge, handle, StringParser} from 'external/gs_tools/src/webc';

import {BaseThemedElement} from 'external/gs_ui/src/common';
import {RouteService} from 'external/gs_ui/src/routing';
import {ThemeService} from 'external/gs_ui/src/theming';

import {Asset} from '../data/asset';
import {AssetCollection} from '../data/asset-collection';
import {DataEvents} from '../data/data-events';
import {Helper} from '../data/helper';
import {RouteFactoryService} from '../routing/route-factory-service';
import {Views} from '../routing/views';


/**
 * Represents a helper item.
 */
@customElement({
  tag: 'pa-asset-helper-item',
  templateKey: 'src/asset/helper-item',
})
export class HelperItem extends BaseThemedElement {
  @bind(null).attribute('asset-id', StringParser)
  private readonly assetIdBridge_: DomBridge<string>;

  @bind(null).attribute('helper-id', StringParser)
  private readonly helperIdBridge_: DomBridge<string>;

  @bind('#name').innerText()
  private readonly nameBridge_: DomBridge<string>;

  @bind('#nameInput').attribute('gs-value', StringParser)
  private readonly nameInputBridge_: DomBridge<string>;

  @bind(null).attribute('project-id', StringParser)
  private readonly projectIdBridge_: DomBridge<string>;

  @bind('#root').attribute('gs-value', StringParser)
  private readonly rootValueBridge_: DomBridge<string>;

  private readonly assetCollection_: AssetCollection;
  private readonly routeFactoryService_: RouteFactoryService;
  private readonly routeService_: RouteService<Views>;

  private helperUpdateDeregister_: DisposableFunction | null;

  constructor(
      @inject('pa.data.AssetCollection') assetCollection: AssetCollection,
      @inject('pa.routing.RouteFactoryService') routeFactoryService: RouteFactoryService,
      @inject('gs.routing.RouteService') routeService: RouteService<Views>,
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);
    this.assetCollection_ = assetCollection;
    this.assetIdBridge_ = DomBridge.of<string>();
    this.helperUpdateDeregister_ = null;
    this.helperIdBridge_ = DomBridge.of<string>();
    this.nameBridge_ = DomBridge.of<string>();
    this.nameInputBridge_ = DomBridge.of<string>();
    this.projectIdBridge_ = DomBridge.of<string>();
    this.rootValueBridge_ =  DomBridge.of<string>();
    this.routeFactoryService_ = routeFactoryService;
    this.routeService_ = routeService;
  }

  /**
   * @return Promise that will be resolved with the asset, or null if the asset cannot be found.
   */
  private getAsset_(): Promise<Asset | null> {
    const assetId = this.assetIdBridge_.get();
    const projectId = this.projectIdBridge_.get();

    if (assetId === null || projectId === null) {
      return Promise.resolve(null);
    }

    return this.assetCollection_.get(projectId, assetId);
  }

  /**
   * @return Promise that will be resolved with the helper, or null if the helper cannot be found.
   */
  private getHelper_(): Promise<Helper | null> {
    const helperId = this.helperIdBridge_.get();
    if (helperId === null) {
      return Promise.resolve(null);
    }

    return this.getAsset_()
        .then((asset: Asset | null) => {
          if (asset === null) {
            return null;
          }

          return asset.getHelper(helperId);
        });
  }

  /**
   * Handles when the helper is updated.
   * @param helper The updated helper.
   */
  private onHelperUpdated_(helper: Helper): void {
    this.nameBridge_.set(helper.getName());
  }

  @handle('#cancel').event(DomEvent.CLICK)
  protected onCancelClick_(): void {
    this.rootValueBridge_.set('read');
  }

  @handle('#delete').event(DomEvent.CLICK)
  protected onDeleteClick_(): Promise<void> {
    return Promise
        .all([
          this.getAsset_(),
          this.getHelper_(),
        ])
        .then((result: [Asset | null, Helper | null]) => {
          let [asset, helper] = result;
          if (asset === null || helper === null) {
            return [];
          }

          asset.deleteHelper(helper.getId());
          return [this.updateHelper_(), this.assetCollection_.update(asset)];

          // TODO: Move to next helper if currently selected helper is deleted.
        })
        .then((promises: Promise<any>[]) => {
          return Promise.all(promises);
        });
  }

  @handle('#edit').event(DomEvent.CLICK)
  protected onEditClick_(): Promise<void> {
    return this.getHelper_()
        .then((helper: Helper | null) => {
          if (helper !== null) {
            this.nameInputBridge_.set(helper.getName());
          } else {
            this.nameInputBridge_.delete();
          }
          this.rootValueBridge_.set('edit');
        });
  }

  @handle('#name').event(DomEvent.CLICK)
  protected onNameClick_(): Promise<void> {
    return Promise
        .all([
          this.getAsset_(),
          this.getHelper_(),
        ])
        .then((result: [Asset | null, Helper | null]) => {
          let [asset, helper] = result;
          if (asset === null || helper === null) {
            return;
          }

          this.routeService_.goTo(this.routeFactoryService_.helper(), {
            assetId: asset.getId(),
            helperId: helper.getId(),
            projectId: asset.getProjectId(),
          });
        });
  }

  @handle('#ok').event(DomEvent.CLICK)
  protected onOkClick_(): Promise<void> {
    const helperId = this.helperIdBridge_.get();
    if (helperId === null) {
      return Promise.resolve();
    }

    return this.getAsset_()
        .then((asset: Asset | null) => {
          if (asset === null) {
            return;
          }

          let helper = asset.getHelper(helperId);
          if (helper === null) {
            return;
          }

          helper.setName(this.nameInputBridge_.get() || '');

          this.rootValueBridge_.set('read');

          return this.assetCollection_.update(asset);
        });
  }

  @handle(null).attributeChange('asset-id', StringParser)
  @handle(null).attributeChange('helper-id', StringParser)
  @handle(null).attributeChange('project-id', StringParser)
  protected updateHelper_(): Promise<void> {
    return this.getHelper_()
        .then((helper: Helper | null) => {
          if (this.helperUpdateDeregister_ !== null) {
            this.helperUpdateDeregister_.dispose();
            this.helperUpdateDeregister_ = null;
          }

          if (helper === null) {
            return;
          }

          this.helperUpdateDeregister_ = helper
              .on(DataEvents.CHANGED, this.onHelperUpdated_.bind(this, helper), this);
          this.onHelperUpdated_(helper);
        });
  }

  /**
   * @override
   */
  disposeInternal(): void {
    if (this.helperUpdateDeregister_ !== null) {
      this.helperUpdateDeregister_.dispose();
    }
    super.disposeInternal();
  }
}
