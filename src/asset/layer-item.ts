import { atomic } from 'external/gs_tools/src/async';
import { Arrays } from 'external/gs_tools/src/collection';
import { DisposableFunction } from 'external/gs_tools/src/dispose';
import { DomEvent } from 'external/gs_tools/src/event';
import { inject } from 'external/gs_tools/src/inject';
import { BooleanParser, EnumParser, StringParser } from 'external/gs_tools/src/parse';
import { BaseIdGenerator, SimpleIdGenerator } from 'external/gs_tools/src/random';
import {
  customElement,
  DomHook,
  handle,
  hook } from 'external/gs_tools/src/webc';

import { BaseThemedElement } from 'external/gs_ui/src/common';
import { ThemeService } from 'external/gs_ui/src/theming';

import { Asset } from '../data/asset';
import { AssetCollection } from '../data/asset-collection';
import { BaseLayer } from '../data/base-layer';
import { DataEvents } from '../data/data-events';
import { HtmlLayer } from '../data/html-layer';
import { ImageLayer } from '../data/image-layer';
import { TextLayer } from '../data/text-layer';


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
  @hook(null).attribute('asset-id', StringParser)
  readonly assetIdHook_: DomHook<string>;

  @hook('#down').attribute('disabled', BooleanParser)
  readonly downDisabledHook_: DomHook<boolean>;

  @hook(null).attribute('layer-id', StringParser)
  readonly layerIdHook_: DomHook<string>;

  @hook('#name').innerText()
  readonly nameHook_: DomHook<string>;

  @hook('#nameInput').attribute('gs-value', StringParser)
  readonly nameInputHook_: DomHook<string>;

  @hook(null).attribute('project-id', StringParser)
  readonly projectIdHook_: DomHook<string>;

  @hook('#switch').attribute('gs-value', EnumParser(Mode))
  readonly switchModeHook_: DomHook<Mode>;

  @hook('#up').attribute('disabled', BooleanParser)
  readonly upDisabledHook_: DomHook<boolean>;

  private readonly assetCollection_: AssetCollection;
  private readonly layerIdGenerator_: BaseIdGenerator;

  private assetDeregister_: DisposableFunction | null;
  private layerDeregister_: DisposableFunction | null;

  constructor(
      @inject('pa.data.AssetCollection') assetCollection: AssetCollection,
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);
    this.assetCollection_ = assetCollection;
    this.assetDeregister_ = null;
    this.assetIdHook_ = DomHook.of<string>();
    this.downDisabledHook_ = DomHook.of<boolean>(true);
    this.layerDeregister_ = null;
    this.layerIdHook_ = DomHook.of<string>();
    this.layerIdGenerator_ = new SimpleIdGenerator();
    this.nameHook_ = DomHook.of<string>();
    this.nameInputHook_ = DomHook.of<string>();
    this.projectIdHook_ = DomHook.of<string>();
    this.switchModeHook_ = DomHook.of<Mode>();
    this.upDisabledHook_ = DomHook.of<boolean>(true);
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
  @atomic()
  async onAssetIdChanged_(): Promise<void> {
    if (this.assetDeregister_ !== null) {
      this.assetDeregister_.dispose();
      this.assetDeregister_ = null;
    }

    const asset = await this.getAsset_();
    if (asset === null) {
      return;
    }

    this.assetDeregister_ = this.listenTo(asset, DataEvents.CHANGED, this.updateLayerPosition_);
    this.updateLayerPosition_();
    this.onLayerIdChanged_();
  }

  @handle('#cancel').event(DomEvent.CLICK, [Mode.READ])
  @handle('#edit').event(DomEvent.CLICK, [Mode.EDIT])
  onChangeModeClick_(mode: Mode, event: Event): void {
    this.switchModeHook_.set(mode);
    event.stopPropagation();
  }

  @handle('#copy').event(DomEvent.CLICK)
  async onCopyClick_(): Promise<void> {
    const [asset, layer] = await Promise.all([this.getAsset_(), this.getLayer_()]);
    if (asset === null || layer === null) {
      return;
    }

    const id = this.layerIdGenerator_.generate(asset.getLayerIds());
    let newLayer: BaseLayer;

    if (layer instanceof HtmlLayer
        || layer instanceof ImageLayer
        || layer instanceof TextLayer) {
      newLayer = layer.copy(id);
    } else {
      throw new Error(`Unsupported layer type: ${layer.getType()}`);
    }
    newLayer.setName(`Copy of layer ${layer.getName()}`);

    asset.insertLayer(newLayer);

    this.assetCollection_.update(asset);
  }

  @handle('#delete').event(DomEvent.CLICK)
  async onDeleteClick_(event: Event): Promise<void> {
    event.stopPropagation();
    const [asset, layer] = await Promise.all([this.getAsset_(), this.getLayer_()]);
    if (asset === null || layer === null) {
      return;
    }

    asset.removeLayer(layer);
    this.assetCollection_.update(asset);
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
  @atomic()
  async onLayerIdChanged_(): Promise<void> {
    if (this.layerDeregister_ !== null) {
      this.layerDeregister_.dispose();
      this.layerDeregister_ = null;
    }

    const layer = await this.getLayer_();
    if (layer === null) {
      return;
    }

    this.layerDeregister_ = this.listenTo(
        layer, DataEvents.CHANGED, this.onLayerChanged_.bind(this, layer));
    this.onLayerChanged_(layer);
    this.updateLayerPosition_();
  }

  @handle('#up').event(DomEvent.CLICK, [-1])
  @handle('#down').event(DomEvent.CLICK, [1])
  async onMoveButtonClick_(moveIndex: number, event: Event): Promise<void> {
    event.stopPropagation();
    const [asset, layer] = await Promise.all([this.getAsset_(), this.getLayer_()]);
    if (asset === null || layer === null) {
      return;
    }

    const index = asset.getLayers().indexOf(layer);
    if (index < 0) {
      return;
    }
    asset.insertLayer(layer, index + moveIndex);
    this.assetCollection_.update(asset);
  }

  @handle('#ok').event(DomEvent.CLICK)
  async onOkClick_(event: Event): Promise<void> {
    event.stopPropagation();

    const [asset, layer] = await Promise.all([this.getAsset_(), this.getLayer_()]);
    if (asset === null || layer === null) {
      return;
    }

    layer.setName(this.nameInputHook_.get() || '');
    this.assetCollection_.update(asset);
    this.switchModeHook_.set(Mode.READ);
  }

  @handle('#root').event(DomEvent.CLICK)
  onRootClick_(event: Event): void {
    if (this.switchModeHook_.get() !== Mode.READ) {
      event.stopPropagation();
    }
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
