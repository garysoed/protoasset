import { inject } from 'external/gs_tools/src/inject';
import { FloatParser } from 'external/gs_tools/src/parse';
import {
  customElement,
  DomHook,
  handle,
  hook } from 'external/gs_tools/src/webc';

import { ThemeService } from 'external/gs_ui/src/theming';

import { AbstractLayerEditor } from '../asset/abstract-layer-editor';
import { AssetCollection } from '../data/asset-collection';
import { BaseLayer } from '../data/base-layer';


/**
 * Base layer editor
 */
@customElement({
  tag: 'pa-asset-base-layer-editor',
  templateKey: 'src/asset/base-layer-editor',
})
export class BaseLayerEditor extends AbstractLayerEditor<BaseLayer> {
  @hook('#bottom').attribute('gs-value', FloatParser)
  readonly bottomHook_: DomHook<number | null>;

  @hook('#left').attribute('gs-value', FloatParser)
  readonly leftHook_: DomHook<number | null>;

  @hook('#right').attribute('gs-value', FloatParser)
  readonly rightHook_: DomHook<number | null>;

  @hook('#top').attribute('gs-value', FloatParser)
  readonly topHook_: DomHook<number | null>;

  constructor(
      @inject('pa.data.AssetCollection') assetCollection: AssetCollection,
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(assetCollection, themeService);
    this.bottomHook_ = DomHook.of<number>();
    this.leftHook_ = DomHook.of<number>();
    this.rightHook_ = DomHook.of<number>();
    this.topHook_ = DomHook.of<number>();
  }

  /**
   * @override
   */
  protected checkLayer_(layer: BaseLayer): BaseLayer {
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
  protected onLayerChange_(layer: BaseLayer): void {
    this.topHook_.set(layer.getTop());
    this.bottomHook_.set(layer.getBottom());
    this.leftHook_.set(layer.getLeft());
    this.rightHook_.set(layer.getRight());
  }
}
// TODO: Mutable
