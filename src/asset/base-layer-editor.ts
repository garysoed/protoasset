import {sequenced} from 'external/gs_tools/src/async';
import {Arrays} from 'external/gs_tools/src/collection';
import {DisposableFunction} from 'external/gs_tools/src/dispose';
import {inject} from 'external/gs_tools/src/inject';
import {
  bind,
  customElement,
  DomHook,
  FloatParser,
  handle,
  StringParser} from 'external/gs_tools/src/webc';

import {BaseThemedElement} from 'external/gs_ui/src/common';
import {ThemeService} from 'external/gs_ui/src/theming';

import {Asset} from '../data/asset';
import {AssetCollection} from '../data/asset-collection';
import {BaseLayer} from '../data/base-layer';
import {DataEvents} from '../data/data-events';


/**
 * Base layer editor
 */
@customElement({
  tag: 'pa-asset-base-layer-editor',
  templateKey: 'src/asset/base-layer-editor',
})
export class BaseLayerEditor extends BaseThemedElement {
  @bind(null).attribute('asset-id', StringParser)
  readonly assetIdHook_: DomHook<string>;

  @bind('#bottom').attribute('gs-value', FloatParser)
  readonly bottomHook_: DomHook<number | null>;

  @bind(null).attribute('layer-id', StringParser)
  readonly layerIdHook_: DomHook<string>;

  @bind('#left').attribute('gs-value', FloatParser)
  readonly leftHook_: DomHook<number | null>;

  @bind(null).attribute('project-id', StringParser)
  readonly projectIdHook_: DomHook<string>;

  @bind('#right').attribute('gs-value', FloatParser)
  readonly rightHook_: DomHook<number | null>;

  @bind('#top').attribute('gs-value', FloatParser)
  readonly topHook_: DomHook<number | null>;

  private readonly assetCollection_: AssetCollection;

  private layerDeregister_: DisposableFunction | null;

  constructor(
      @inject('pa.data.AssetCollection') assetCollection: AssetCollection,
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);
    this.assetCollection_ = assetCollection;
    this.assetIdHook_ = DomHook.of<string>();
    this.bottomHook_ = DomHook.of<number>();
    this.layerDeregister_ = null;
    this.layerIdHook_ = DomHook.of<string>();
    this.leftHook_ = DomHook.of<number>();
    this.projectIdHook_ = DomHook.of<string>();
    this.rightHook_ = DomHook.of<number>();
    this.topHook_ = DomHook.of<number>();
  }

  /**
   * Gets the asset to use.
   * @return Promise that will be resolved with the asset, or null if it cannot be found.
   */
  private async getAsset_(): Promise<Asset | null> {
    let assetId = this.assetIdHook_.get();
    let projectId = this.projectIdHook_.get();
    if (assetId === null || projectId === null) {
      return null;
    }

    return await this.assetCollection_.get(projectId, assetId);
  }

  /**
   * Gets the layer to edit.
   * @return Promise that will be resolved with the layer, or null if it cannot be found.
   */
  private async getLayer_(): Promise<BaseLayer | null> {
    const layerId = this.layerIdHook_.get();
    if (layerId === null) {
      return null;
    }

    let asset = await this.getAsset_();
    if (asset === null) {
      return null;
    }

    let layer = Arrays
        .of(asset.getLayers())
        .find((layer: BaseLayer) => {
          return layer.getId() === layerId;
        });

    if (layer === null) {
      return null;
    }

    return layer;
  }

  @handle('#top').attributeChange('gs-value')
  @handle('#bottom').attributeChange('gs-value')
  @handle('#left').attributeChange('gs-value')
  @handle('#right').attributeChange('gs-value')
  async onDataChanged_(): Promise<void> {
    const [asset, layer] = await Promise.all([this.getAsset_(), this.getLayer_()]);
    if (asset === null || layer === null) {
      return;
    }

    layer.setBottom(this.bottomHook_.get() || 0);
    layer.setLeft(this.leftHook_.get() || 0);
    layer.setRight(this.rightHook_.get() || 0);
    layer.setTop(this.topHook_.get() || 0);
    await this.assetCollection_.update(asset);
  }

  /**
   * Handles when there is data change on the given layer.
   * @param layer Layer whose data was changed.
   */
  private onLayerChange_(layer: BaseLayer): void {
    this.topHook_.set(layer.getTop());
    this.bottomHook_.set(layer.getBottom());
    this.leftHook_.set(layer.getLeft());
    this.rightHook_.set(layer.getRight());
  }

  @handle(null).attributeChange('asset-id')
  @handle(null).attributeChange('project-id')
  @handle(null).attributeChange('layer-id')
  @sequenced()
  protected async onLayerIdChange_(): Promise<void> {
    if (this.layerDeregister_ !== null) {
      this.layerDeregister_.dispose();
      this.layerDeregister_ = null;
    }

    let layer = await this.getLayer_();
    if (layer === null) {
      return;
    }

    this.layerDeregister_ = layer
        .on(DataEvents.CHANGED, this.onLayerChange_.bind(this, layer), this);
    this.onLayerChange_(layer);
  }
}
