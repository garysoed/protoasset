import { cache, Serializable } from 'external/gs_tools/src/data';
import { field } from 'external/gs_tools/src/datamodel';

import { Layer } from '../data/layer';
import { LayerType } from '../data/layer-type';

/**
 * Layer that displays an image.
 */
@Serializable('imageLayer')
export abstract class ImageLayer2 extends Layer {
  @field('imageUrl') protected readonly imageUrl_: string;

  constructor() {
    super(LayerType.IMAGE);
    this.imageUrl_ = '';
  }

  /**
   * @override
   */
  @cache()
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
  @cache()
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
   * @param styles Styles to apply to the created div.
   * @return Newly created DIV element with the gien styles applied.
   */
  @cache()
  private createDiv_(styles: string[]): string {
    return `<div style="${styles.join('')}"></div>`;
  }

  /**
   * @return The URL of the image in the layer.
   */
  abstract getImageUrl(): string;

  /**
   * @param imageUrl URL of the image to display.
   */
  abstract setImageUrl(imageUrl: string): ImageLayer2;
}
