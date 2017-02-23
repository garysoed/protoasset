import {inject} from 'external/gs_tools/src/inject';
import {bind, customElement, DomHook, handle, StringParser} from 'external/gs_tools/src/webc';

import {ThemeService} from 'external/gs_ui/src/theming';

import {AssetCollection} from '../data/asset-collection';
import {BaseLayer} from '../data/base-layer';
import {TextLayer} from '../data/text-layer';

import {AbstractLayerEditor} from './abstract-layer-editor';


/**
 * Text layer editor
 */
@customElement({
  tag: 'pa-asset-text-layer-editor',
  templateKey: 'src/asset/text-layer-editor',
})
export class TextLayerEditor extends AbstractLayerEditor<TextLayer> {

  @bind('#color').attribute('gs-value', StringParser)
  readonly colorHook_: DomHook<string>;

  @bind('#fontFamily').attribute('gs-value', StringParser)
  readonly fontFamilyHook_: DomHook<string>;

  @bind('#fontUrl').attribute('gs-value', StringParser)
  readonly fontUrlHook_: DomHook<string>;

  @bind('#size').attribute('gs-value', StringParser)
  readonly sizeHook_: DomHook<string>;

  @bind('#text').attribute('gs-value', StringParser)
  readonly textHook_: DomHook<string>;

  constructor(
      @inject('pa.data.AssetCollection') assetCollection: AssetCollection,
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(assetCollection, themeService);
    this.colorHook_ = DomHook.of<string>();
    this.fontFamilyHook_ = DomHook.of<string>();
    this.fontUrlHook_ = DomHook.of<string>();
    this.sizeHook_ = DomHook.of<string>();
    this.textHook_ = DomHook.of<string>();
  }

  /**
   * @override
   */
  protected checkLayer_(layer: BaseLayer): TextLayer | null {
    return layer instanceof TextLayer ? layer : null;
  }

  @handle('#color').attributeChange('gs-value')
  @handle('#fontFamily').attributeChange('gs-value')
  @handle('#fontUrl').attributeChange('gs-value')
  @handle('#size').attributeChange('gs-value')
  @handle('#text').attributeChange('gs-value')
  async onFieldsChanged_(): Promise<void> {
    const layer = await this.getLayer_();
    if (layer === null) {
      return;
    }

    const color = this.colorHook_.get();
    if (color !== null) {
      layer.setColor(color);
    }

    const fontFamily = this.fontFamilyHook_.get();
    if (fontFamily !== null) {
      layer.setFontFamily(fontFamily);
    }

    layer.setFontUrl(this.fontUrlHook_.get());

    const size = this.sizeHook_.get();
    if (size !== null) {
      layer.setSize(size);
    }
    layer.setText(this.textHook_.get() || '');
  }

  /**
   * @override
   */
  protected onLayerChange_(layer: TextLayer): void {
    this.colorHook_.set(layer.getColor());
    this.fontFamilyHook_.set(layer.getFontFamily());
    this.fontUrlHook_.set(layer.getFontUrl() || '');
    this.sizeHook_.set(layer.getSize());
    this.textHook_.set(layer.getText());
  }
}
