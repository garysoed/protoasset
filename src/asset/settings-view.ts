import { Serializer } from 'external/gs_tools/src/data';
import { DomEvent } from 'external/gs_tools/src/event';
import { ImmutableSet } from 'external/gs_tools/src/immutable';
import { inject } from 'external/gs_tools/src/inject';
import { EnumParser, FloatParser, StringParser } from 'external/gs_tools/src/parse';
import { Cases } from 'external/gs_tools/src/string';
import {
  customElement,
  DomHook,
  handle,
  hook } from 'external/gs_tools/src/webc';

import { BaseThemedElement } from 'external/gs_ui/src/common';
import { RouteServiceEvents } from 'external/gs_ui/src/const';
import { RouteService } from 'external/gs_ui/src/routing';
import { ThemeService } from 'external/gs_ui/src/theming';
import { DownloadService } from 'external/gs_ui/src/tool';

import { Editor } from '../asset/editor';
import { Asset, AssetType } from '../data/asset';
import { AssetCollection } from '../data/asset-collection';
import { RouteFactoryService } from '../routing/route-factory-service';
import { Views } from '../routing/views';


/**
 * Asset settings view
 */
@customElement({
  dependencies: ImmutableSet.of([DownloadService, Editor]),
  tag: 'pa-asset-settings-view',
  templateKey: 'src/asset/settings-view',
})
export class SettingsView extends BaseThemedElement {
  @hook('#assetName').innerText()
  readonly assetDisplayNameHook_: DomHook<string>;

  @hook('#assetEditor').attribute('asset-type', EnumParser(AssetType))
  readonly assetTypeHook_: DomHook<AssetType>;

  @hook('#assetEditor').attribute('asset-height', FloatParser)
  readonly heightHook_: DomHook<number>;

  @hook('#assetEditor').attribute('asset-name', StringParser)
  readonly nameHook_: DomHook<string>;

  @hook('#assetEditor').attribute('asset-width', FloatParser)
  readonly widthHook_: DomHook<number>;

  private readonly assetCollection_: AssetCollection;
  private readonly downloadService_: DownloadService;
  private readonly routeFactoryService_: RouteFactoryService;
  private readonly routeService_: RouteService<Views>;

  constructor(
      @inject('pa.data.AssetCollection') assetCollection: AssetCollection,
      @inject('gs.tool.DownloadService') downloadService: DownloadService,
      @inject('pa.routing.RouteFactoryService') routeFactoryService: RouteFactoryService,
      @inject('gs.routing.RouteService') routeService: RouteService<Views>,
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);
    this.assetCollection_ = assetCollection;
    this.assetDisplayNameHook_ = DomHook.of<string>();
    this.assetTypeHook_ = DomHook.of<AssetType>();
    this.downloadService_ = downloadService;
    this.heightHook_ = DomHook.of<number>();
    this.nameHook_ = DomHook.of<string>();
    this.routeFactoryService_ = routeFactoryService;
    this.routeService_ = routeService;
    this.widthHook_ = DomHook.of<number>();
  }

  /**
   * @return Promise that will be resolved with the currently selected asset, or null if the asset
   *    cannot be found.
   */
  private async getAsset_(): Promise<Asset | null> {
    const params = this.routeService_.getParams(this.routeFactoryService_.assetSettings());
    if (params === null) {
      return null;
    }

    return this.assetCollection_.get(params.projectId, params.assetId);
  }

  @handle('#assetEditor').attributeChange('asset-type')
  @handle('#assetEditor').attributeChange('asset-name')
  @handle('#assetEditor').attributeChange('asset-height')
  @handle('#assetEditor').attributeChange('asset-width')
  async onAssetChanged_(): Promise<void> {
    const asset = await this.getAsset_();
    if (asset === null) {
      return;
    }

    const assetType = this.assetTypeHook_.get();
    if (assetType !== null) {
      asset.setType(assetType);
    }

    const assetName = this.nameHook_.get();
    if (assetName !== null) {
      asset.setName(assetName);
      this.assetDisplayNameHook_.set(assetName);
    }

    const height = this.heightHook_.get();
    if (height !== null) {
      asset.setHeight(height);
    }

    const width = this.widthHook_.get();
    if (width !== null) {
      asset.setWidth(width);
    }
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

  @handle('#downloadButton').event(DomEvent.CLICK)
  async onDownloadClicked_(): Promise<void> {
    const asset = await this.getAsset_();
    if (asset === null) {
      return;
    }

    this.downloadService_.downloadJson(
        Serializer.toJSON(asset),
        `${Cases.of(asset.getName()).toLowerCase()}.json`);
  }

  /**
   * Handles event when route is changed.
   */
  private async onRouteChanged_(): Promise<void> {
    const asset = await this.getAsset_();
    if (asset === null) {
      return;
    }

    this.assetDisplayNameHook_.set(asset.getName());
    this.assetTypeHook_.set(asset.getType());
    this.nameHook_.set(asset.getName());
    this.heightHook_.set(asset.getHeight());
    this.widthHook_.set(asset.getWidth());
  }
}
// TODO: Mutable
