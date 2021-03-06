import { atomic } from 'external/gs_tools/src/async';
import { DisposableFunction } from 'external/gs_tools/src/dispose';
import { ImmutableList } from 'external/gs_tools/src/immutable';
import { StringParser } from 'external/gs_tools/src/parse';
import {
  DomHook,
  handle,
  hook } from 'external/gs_tools/src/webc';

import { BaseThemedElement } from 'external/gs_ui/src/common';
import { ThemeService } from 'external/gs_ui/src/theming';

import { Asset } from '../data/asset';
import { AssetCollection } from '../data/asset-collection';
import { BaseLayer } from '../data/base-layer';
import { DataEvents } from '../data/data-events';


export abstract class AbstractLayerEditor<T extends BaseLayer> extends BaseThemedElement {
  @hook(null).attribute('asset-id', StringParser)
  readonly assetIdHook_: DomHook<string>;

  @hook(null).attribute('layer-id', StringParser)
  readonly layerIdHook_: DomHook<string>;

  @hook(null).attribute('project-id', StringParser)
  readonly projectIdHook_: DomHook<string>;

  protected readonly assetCollection_: AssetCollection;

  private layerDeregister_: DisposableFunction | null;

  constructor(
      assetCollection: AssetCollection,
      themeService: ThemeService) {
    super(themeService);
    this.assetCollection_ = assetCollection;
    this.assetIdHook_ = DomHook.of<string>();
    this.layerDeregister_ = null;
    this.layerIdHook_ = DomHook.of<string>();
    this.projectIdHook_ = DomHook.of<string>();
  }

  protected abstract checkLayer_(layer: BaseLayer): T | null;

  /**
   * @override
   */
  disposeInternal(): void {
    if (this.layerDeregister_ !== null) {
      this.layerDeregister_.dispose();
    }
    super.disposeInternal();
  }

  /**
   * Gets the asset to use.
   * @return Promise that will be resolved with the asset, or null if it cannot be found.
   */
  protected async getAsset_(): Promise<Asset | null> {
    const assetId = this.assetIdHook_.get();
    const projectId = this.projectIdHook_.get();
    if (assetId === null || projectId === null) {
      return null;
    }

    return await this.assetCollection_.get(projectId, assetId);
  }

  /**
   * Gets the layer to edit.
   * @return Promise that will be resolved with the layer, or null if it cannot be found.
   */
  protected async getLayer_(): Promise<T | null> {
    const layerId = this.layerIdHook_.get();
    if (layerId === null) {
      return null;
    }

    const asset = await this.getAsset_();
    if (asset === null) {
      return null;
    }

    const layer = ImmutableList
        .of(asset.getLayers())
        .find((layer: BaseLayer) => {
          return layer.getId() === layerId;
        });

    if (layer === null) {
      return null;
    }

    return this.checkLayer_(layer);
  }

  protected abstract onLayerChange_(layer: T): void;

  @handle(null).attributeChange('asset-id')
  @handle(null).attributeChange('project-id')
  @handle(null).attributeChange('layer-id')
  @atomic()
  protected async onLayerIdChange_(): Promise<void> {
    if (this.layerDeregister_ !== null) {
      this.layerDeregister_.dispose();
      this.layerDeregister_ = null;
    }

    const layer = await this.getLayer_();
    if (layer === null) {
      return;
    }

    this.layerDeregister_ = this.listenTo(
        layer, DataEvents.CHANGED, this.onLayerChange_.bind(this, layer));
    this.onLayerChange_(layer);
  }
}
// TODO: Mutable
