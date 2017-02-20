import {Field, Serializable} from 'external/gs_tools/src/data';

import {BaseLayer} from './base-layer';
import {DataEvents} from './data-events';
import {LayerType} from './layer-type';


/**
 * Layer that displays an image.
 */
@Serializable('imageLayer')
export class ImageLayer extends BaseLayer {
  @Field('bottom') private bottom_: number;
  @Field('imageUrl') private imageUrl_: string;
  @Field('left') private left_: number;
  @Field('right') private right_: number;
  @Field('top') private top_: number;

  constructor(id: string, name: string) {
    super(id, name, LayerType.IMAGE);
    this.bottom_ = 0;
    this.imageUrl_ = '';
    this.left_ = 0;
    this.right_ = 0;
    this.top_ = 0;
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
   * @return The bottom bounding box of the image layer, in px.
   */
  getBottom(): number {
    return this.bottom_;
  }

  /**
   * @return Array of styles based on the boundary box top, left, bottom, right.
   */
  private getBoxStyles_(): string[] {
    return [
      `bottom: ${this.bottom_}px;`,
      `left: ${this.left_}px;`,
      `right: ${this.right_}px;`,
      `top: ${this.top_}px;`,
      `position: absolute;`,
    ];
  }

  /**
   * @return The URL of the image in the layer.
   */
  getImageUrl(): string {
    return this.imageUrl_;
  }

  /**
   * @return The left bounding box of the image layer, in px.
   */
  getLeft(): number {
    return this.left_;
  }

  /**
   * @return The right bounding box of the image layer, in px.
   */
  getRight(): number {
    return this.right_;
  }

  /**
   * @return The top bounding box of the image layer, in px.
   */
  getTop(): number {
    return this.top_;
  }

  /**
   * @param bottom The bottom of the bounding box to set, in px.
   */
  setBottom(bottom: number): void {
    if (this.bottom_ === bottom) {
      return;
    }

    this.dispatch(DataEvents.CHANGED, () => {
      this.bottom_ = bottom;
    });
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

  /**
   * @param left The left of the bounding box to set, in px.
   */
  setLeft(left: number): void {
    if (this.left_ === left) {
      return;
    }

    this.dispatch(DataEvents.CHANGED, () => {
      this.left_ = left;
    });
  }

  /**
   * @param right The right of the bounding box to set, in px.
   */
  setRight(right: number): void {
    if (this.right_ === right) {
      return;
    }

    this.dispatch(DataEvents.CHANGED, () => {
      this.right_ = right;
    });
  }

  /**
   * @param top The top of the bounding box to set, in px.
   */
  setTop(top: number): void {
    if (this.top_ === top) {
      return;
    }

    this.dispatch(DataEvents.CHANGED, () => {
      this.top_ = top;
    });
  }
}
