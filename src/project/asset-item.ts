import {DomEvent} from 'external/gs_tools/src/event';
import {inject} from 'external/gs_tools/src/inject';
import {bind, customElement, DomBridge, handle, StringParser} from 'external/gs_tools/src/webc';

import {BaseThemedElement} from 'external/gs_ui/src/common';
import {RouteService} from 'external/gs_ui/src/routing';
import {ThemeService} from 'external/gs_ui/src/theming';

import {Asset} from '../data/asset';
import {AssetCollection} from '../data/asset-collection';
import {RouteFactoryService} from '../routing/route-factory-service';
import {Views} from '../routing/views';


/**
 * Displays an asset item.
 */
@customElement({
  tag: 'pa-asset-item',
  templateKey: 'src/project/asset-item',
})
export class AssetItem extends BaseThemedElement {
  @bind('#assetName').innerText()
  private readonly assetNameBridge_: DomBridge<string>;

  @bind(null).attribute('gs-asset-id', StringParser)
  private readonly gsAssetIdBridge_: DomBridge<string>;

  @bind(null).attribute('gs-project-id', StringParser)
  private readonly gsProjectIdBridge_: DomBridge<string>;

  private readonly assetCollection_: AssetCollection;
  private readonly routeFactoryService_: RouteFactoryService;
  private readonly routeService_: RouteService<Views>;

  constructor(
      @inject('pa.data.AssetCollection') assetCollection: AssetCollection,
      @inject('pa.routing.RouteFactoryService') routeFactoryService: RouteFactoryService,
      @inject('gs.routing.RouteService') routeService: RouteService<Views>,
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);
    this.assetCollection_ = assetCollection;
    this.assetNameBridge_ = DomBridge.of<string>();
    this.gsAssetIdBridge_ = DomBridge.of<string>();
    this.gsProjectIdBridge_ = DomBridge.of<string>();
    this.routeFactoryService_ = routeFactoryService;
    this.routeService_ = routeService;
  }

  @handle(null).event(DomEvent.CLICK)
  protected onElementClicked_(): void {
    let assetId = this.gsAssetIdBridge_.get();
    let projectId = this.gsProjectIdBridge_.get();
    if (assetId !== null && projectId !== null) {
      this.routeService_.goTo(
          this.routeFactoryService_.assetMain(),
          {assetId: assetId, projectId: projectId});
    }
  }

  @handle(null).attributeChange('gs-asset-id', StringParser)
  protected onGsAssetIdChanged_(): Promise<any> {
    let assetId = this.gsAssetIdBridge_.get();
    let projectId = this.gsProjectIdBridge_.get();
    if (assetId === null || projectId === null) {
      this.assetNameBridge_.delete();
      return Promise.resolve();
    }

    return this.assetCollection_
        .get(projectId, assetId)
        .then((asset: Asset | null) => {
          if (asset !== null) {
            this.assetNameBridge_.set(asset.getName());
          }
        });
  }
}
