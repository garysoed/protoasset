import {Field, Serializable} from 'external/gs_tools/src/data';

import {BaseLayer} from './base-layer';
import {DataEvents} from './data-events';
import {LayerType} from './layer-type';


/**
 * Layer that displays an image.
 */
@Serializable('imageLayer')
export class ImageLayer extends BaseLayer {
  @Field('imageUrl') private imageUrl_: string;

  constructor(id: string, name: string) {
    super(id, name, LayerType.IMAGE);
    this.imageUrl_ = '';
    // TODO: Move the box stuff to BaseLayer.
  }

  /**
   * @override
   */
  protected asActiveBoundaryPreviewHtml_(): {css: string, html: string} {
    const styles: string[] = this.getBoxStyles_().concat([
      `background-color: var(--gsThemeNormal);`,
    ]);
    return {css: '', html: this.createDiv_(styles)};
  }

  /**
   * @override
   */
  asHtml(): {css: string, html: string} {
    const styles: string[] = this.getBoxStyles_().concat([
      `background: url('${this.imageUrl_}');`,
      `background-repeat: no-repeat;`,
      `background-size: contain;`,
    ]);

    // TODO: Use the layer ID for CSS selection.
    return {css: '', html: this.createDiv_(styles)};
  }

  /**
   * @override
   */
  protected asInactiveNormalPreviewHtml_(): {css: string, html: string} {
    const styles: string[] = this.getBoxStyles_().concat([
      `background: url('${this.imageUrl_}');`,
      `background-repeat: no-repeat;`,
      `background-size: contain;`,
      `filter: grayscale(50%);`,
      `opacity: .5;`,
    ]);
    return {css: '', html: this.createDiv_(styles)};
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
