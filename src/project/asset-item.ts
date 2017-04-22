import { DomEvent } from 'external/gs_tools/src/event';
import { inject } from 'external/gs_tools/src/inject';
import { StringParser } from 'external/gs_tools/src/parse';
import { customElement, DomHook, handle, hook } from 'external/gs_tools/src/webc';

import { BaseThemedElement } from 'external/gs_ui/src/common';
import { RouteService } from 'external/gs_ui/src/routing';
import { ThemeService } from 'external/gs_ui/src/theming';

import { AssetCollection } from '../data/asset-collection';
import { RouteFactoryService } from '../routing/route-factory-service';
import { Views } from '../routing/views';


/**
 * Displays an asset item.
 */
@customElement({
  tag: 'pa-asset-item',
  templateKey: 'src/project/asset-item',
})
export class AssetItem extends BaseThemedElement {
  @hook('#assetName').innerText()
  private readonly assetNameHook_: DomHook<string>;

  @hook(null).attribute('gs-asset-id', StringParser)
  private readonly gsAssetIdHook_: DomHook<string>;

  @hook(null).attribute('gs-project-id', StringParser)
  private readonly gsProjectIdHook_: DomHook<string>;

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
    this.assetNameHook_ = DomHook.of<string>();
    this.gsAssetIdHook_ = DomHook.of<string>();
    this.gsProjectIdHook_ = DomHook.of<string>();
    this.routeFactoryService_ = routeFactoryService;
    this.routeService_ = routeService;
  }

  @handle(null).event(DomEvent.CLICK)
  protected onElementClicked_(): void {
    let assetId = this.gsAssetIdHook_.get();
    let projectId = this.gsProjectIdHook_.get();
    if (assetId !== null && projectId !== null) {
      this.routeService_.goTo(
          this.routeFactoryService_.assetMain(),
          {assetId: assetId, projectId: projectId});
    }
  }

  @handle(null).attributeChange('gs-asset-id', StringParser)
  protected async onGsAssetIdChanged_(): Promise<any> {
    let assetId = this.gsAssetIdHook_.get();
    let projectId = this.gsProjectIdHook_.get();
    if (assetId === null || projectId === null) {
      this.assetNameHook_.delete();
      return;
    }

    let asset = await this.assetCollection_.get(projectId, assetId);
    if (asset !== null) {
      this.assetNameHook_.set(asset.getName());
    }
  }
}
