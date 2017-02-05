import {Arrays} from 'external/gs_tools/src/collection';
import {DisposableFunction} from 'external/gs_tools/src/dispose';
import {DomEvent} from 'external/gs_tools/src/event';
import {inject} from 'external/gs_tools/src/inject';
import {
  bind,
  BooleanParser,
  customElement,
  DomBridge,
  EnumParser,
  handle,
  StringParser} from 'external/gs_tools/src/webc';

import {BaseThemedElement} from 'external/gs_ui/src/common';
import {ThemeService} from 'external/gs_ui/src/theming';

import {Asset} from '../data/asset';
import {AssetCollection} from '../data/asset-collection';
import {BaseLayer} from '../data/base-layer';
import {DataEvents} from '../data/data-events';


export enum Mode {
  EDIT,
  READ,
}


/**
 * Layer item
 */
@customElement({
  tag: 'pa-asset-layer-item',
  templateKey: 'src/asset/layer-item',
})
export class LayerItem extends BaseThemedElement {
  @bind(null).attribute('asset-id', StringParser)
  readonly assetIdHook_: DomBridge<string>;

  @bind('#down').attribute('disabled', BooleanParser)
  readonly downDisabledHook_: DomBridge<boolean>;

  @bind(null).attribute('layer-id', StringParser)
  readonly layerIdHook_: DomBridge<string>;

  @bind('#name').innerText()
  readonly nameHook_: DomBridge<string>;

  @bind('#nameInput').attribute('gs-value', StringParser)
  readonly nameInputHook_: DomBridge<string>;

  @bind(null).attribute('project-id', StringParser)
  readonly projectIdHook_: DomBridge<string>;

  @bind('#root').attribute('gs-value', EnumParser(Mode))
  readonly rootModeHook_: DomBridge<Mode>;

  @bind('#up').attribute('disabled', BooleanParser)
  readonly upDisabledHook_: DomBridge<boolean>;

  private readonly assetCollection_: AssetCollection;

  private assetDeregister_: DisposableFunction | null;
  private layerDeregister_: DisposableFunction | null;

  constructor(
      @inject('pa.data.AssetCollection') assetCollection: AssetCollection,
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);
    this.assetCollection_ = assetCollection;
    this.assetDeregister_ = null;
    this.assetIdHook_ = DomBridge.of<string>();
    this.downDisabledHook_ = DomBridge.of<boolean>(true);
    this.layerDeregister_ = null;
    this.layerIdHook_ = DomBridge.of<string>();
    this.nameHook_ = DomBridge.of<string>();
    this.nameInputHook_ = DomBridge.of<string>();
    this.projectIdHook_ = DomBridge.of<string>();
    this.rootModeHook_ = DomBridge.of<Mode>();
    this.upDisabledHook_ = DomBridge.of<boolean>(true);
  }

  /**
   * @override
   */
  disposeInternal(): void {
    if (this.assetDeregister_ !== null) {
      this.assetDeregister_.dispose();
    }

    if (this.layerDeregister_ !== null) {
      this.layerDeregister_.dispose();
    }

    super.disposeInternal();
  }

  /**
   * @return Promise that will be resolved with the asset, or null if it cannot be determined.
   */
  private async getAsset_(): Promise<Asset | null> {
    const assetId = this.assetIdHook_.get();
    const projectId = this.projectIdHook_.get();
    if (assetId === null || projectId === null) {
      return null;
    }

    return await this.assetCollection_.get(projectId, assetId);
  }

  /**
   * @return Promise that will be resolved with the layer, or null if it cannot be determined.
   */
  private async getLayer_(): Promise<BaseLayer | null> {
    const layerId = this.layerIdHook_.get();
    if (layerId === null) {
      return null;
    }

    const asset = await this.getAsset_();
    if (asset === null) {
      return null;
    }

    return Arrays
        .of(asset.getLayers())
        .find((layer: BaseLayer) => {
          return layer.getId() === layerId;
        });
  }

  @handle(null).attributeChange('asset-id', StringParser)
  @handle(null).attributeChange('project-id', StringParser)
  async onAssetIdChanged_(): Promise<void> {
    if (this.assetDeregister_ !== null) {
      this.assetDeregister_.dispose();
      this.assetDeregister_ = null;
    }

    const asset = await this.getAsset_();
    if (asset === null) {
      return;
    }

    this.assetDeregister_ = asset.on(DataEvents.CHANGED, this.updateLayerPosition_, this);
    this.updateLayerPosition_();
    this.onLayerIdChanged_();
  }

  /**
   * Handles when the layer was changed.
   * @param layer The layer that was changed.
   */
  private onLayerChanged_(layer: BaseLayer): void {
    this.nameHook_.set(layer.getName());
    this.nameInputHook_.set(layer.getName());
  }

  @handle(null).attributeChange('layer-id', StringParser)
  async onLayerIdChanged_(): Promise<void> {
    if (this.layerDeregister_ !== null) {
      this.layerDeregister_.dispose();
      this.layerDeregister_ = null;
    }

    const layer = await this.getLayer_();
    if (layer === null) {
      return;
    }

    this.layerDeregister_ = layer.on(
        DataEvents.CHANGED, this.onLayerChanged_.bind(this, layer), this);
    this.onLayerChanged_(layer);
    this.updateLayerPosition_();
  }

  @handle('#ok').event(DomEvent.CLICK)
  async onOkClick_(): Promise<void> {
    const [asset, layer] = await Promise.all([this.getAsset_(), this.getLayer_()]);
    if (asset === null || layer === null) {
      return;
    }

    layer.setName(this.nameInputHook_.get() || '');
    this.assetCollection_.update(asset);
    this.setMode_(Mode.READ);
  }

  @handle('#cancel').event(DomEvent.CLICK, [Mode.READ])
  @handle('#edit').event(DomEvent.CLICK, [Mode.EDIT])
  setMode_(mode: Mode): void {
    this.rootModeHook_.set(mode);
  }

  /**
   * Updates the UI based on the layer's position.
   */
  private async updateLayerPosition_(): Promise<void> {
    const [asset, layer] = await Promise.all([this.getAsset_(), this.getLayer_()]);
    if (asset === null || layer === null) {
      return;
    }

    const layers = asset.getLayers();
    const layerIndex = layers.indexOf(layer);

    if (layerIndex < 0) {
      return;
    }

    this.upDisabledHook_.set(layerIndex <= 0);
    this.downDisabledHook_.set(layerIndex >= layers.length - 1);
  }
}
