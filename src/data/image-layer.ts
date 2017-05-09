import { Field, Serializable } from 'external/gs_tools/src/data';

import { BaseLayer } from '../data/base-layer';
import { DataEvents } from '../data/data-events';
import { LayerType } from '../data/layer-type';


/**
 * Layer that displays an image.
 */
@Serializable('imageLayer')
export class ImageLayer extends BaseLayer {
  @Field('imageUrl') private imageUrl_: string;

  constructor(id: string, name: string) {
    super(id, name, LayerType.IMAGE);
    this.imageUrl_ = '';
  }

  /**
   * @override
   */
  asHtml(): {css: string, html: string} {
    // NOTE: html2canvas does not support background-size.
    const styles: string[] = this.getBoxStyles_().concat([
      `background: url('${this.imageUrl_}');`,
      `background-repeat: no-repeat;`,
    ]);

    // TODO: Use the layer ID for CSS selection.
    return {css: '', html: this.createDiv_(styles)};
  }

  /**
   * @override
   */
  protected asInactiveNormalPreviewHtml_(): {css: string, html: string} {
    // TODO: Refactor this better.
    // NOTE: html2canvas does not support background-size.
    const styles: string[] = this.getBoxStyles_().concat([
      `background: url('${this.imageUrl_}');`,
      `background-repeat: no-repeat;`,
      `filter: grayscale(50%);`,
      `opacity: .5;`,
    ]);
    return {css: '', html: this.createDiv_(styles)};
  }

  /**
   * @param id ID of the layer copy to use.
   * @return Copy of the current layer with the given ID.
   */
  copy(id: string): ImageLayer {
    const newLayer = new ImageLayer(id, this.getName());
    this.copyInto_(newLayer);
    return newLayer;
  }

  /**
   * @override
   */
  protected copyInto_(targetLayer: ImageLayer): void {
    super.copyInto_(targetLayer);
    targetLayer.setImageUrl(this.getImageUrl());
  }

  /**
   * @param styles Styles to apply to the created div.
   * @return Newly created DIV element with the gien styles applied.
   */
  private createDiv_(styles: string[]): string {
    return `<div style="${styles.join('')}"></div>`;
  }

  /**
   * @return The URL of the image in the layer.
   */
  getImageUrl(): string {
    return this.imageUrl_;
  }

  /**
   * @param imageUrl URL of the image to display.
   */
  setImageUrl(imageUrl: string): void {
    if (this.imageUrl_ === imageUrl) {
      return;
    }

    this.dispatch(DataEvents.CHANGED, () => {
      this.imageUrl_ = imageUrl;
    });
  }
}
// TODO: Mutable
