import { ImmutableSet } from 'external/gs_tools/src/immutable';
import { inject } from 'external/gs_tools/src/inject';
import { StringParser } from 'external/gs_tools/src/parse';
import {
  customElement,
  DomHook,
  handle,
  hook } from 'external/gs_tools/src/webc';

import { ThemeService } from 'external/gs_ui/src/theming';

import { AbstractLayerEditor } from '../asset/abstract-layer-editor';
import { AssetCollection } from '../data/asset-collection';
import { BaseLayer } from '../data/base-layer';
import { HtmlLayer } from '../data/html-layer';
import { TemplateCompilerService } from '../data/template-compiler-service';


/**
 * HTML Layer Editor
 */
@customElement({
  dependencies: ImmutableSet.of([TemplateCompilerService]),
  tag: 'pa-asset-html-layer-editor',
  templateKey: 'src/asset/html-layer-editor',
})
export class HtmlLayerEditor extends AbstractLayerEditor<HtmlLayer> {
  @hook('#cssInput').attribute('gs-value', StringParser)
  readonly cssValueHook_: DomHook<string>;

  @hook('#htmlInput').attribute('gs-value', StringParser)
  readonly htmlValueHook_: DomHook<string>;

  constructor(
      @inject('pa.data.AssetCollection') assetCollection: AssetCollection,
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(assetCollection, themeService);
    this.cssValueHook_ = DomHook.of<string>();
    this.htmlValueHook_ = DomHook.of<string>();
  }

  /**
   * @override
   */
  checkLayer_(layer: BaseLayer): HtmlLayer | null {
    return layer instanceof HtmlLayer ? layer : null;
  }

  @handle('#cssInput').attributeChange('gs-value')
  @handle('#htmlInput').attributeChange('gs-value')
  async onDataChanged_(): Promise<void> {
    const [asset, layer] = await Promise.all([this.getAsset_(), this.getLayer_()]);
    if (asset === null || layer === null) {
      return;
    }

    const css = this.cssValueHook_.get();
    if (css !== null) {
      layer.setCss(css);
    }

    const html = this.htmlValueHook_.get();
    if (html !== null) {
      layer.setHtml(html);
    }

    this.assetCollection_.update(asset);
  }

  /**
   * Handles when there is data change on the given layer.
   * @param layer Layer whose data was changed.
   */
  protected onLayerChange_(layer: HtmlLayer): void {
    this.cssValueHook_.set(layer.getCss());
    this.htmlValueHook_.set(layer.getHtml());
  }
}
// TODO: Mutable
