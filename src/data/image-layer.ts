import {Field, Serializable} from 'external/gs_tools/src/data';

import {BaseLayer} from './base-layer';
import {DataEvents} from './data-events';
import {LayerType} from './layer-type';


/**
 * Layer that displays an image.
 */
@Serializable('imageLayer')
export class ImageLayer extends BaseLayer {
  @Field('bottom') private bottom_: number | null;
  @Field('imageUrl') private imageUrl_: string;
  @Field('left') private left_: number | null;
  @Field('right') private right_: number | null;
  @Field('top') private top_: number | null;

  constructor(id: string, name: string) {
    super(id, name, LayerType.IMAGE);
    this.bottom_ = null;
    this.imageUrl_ = '';
    this.left_ = null;
    this.right_ = null;
    this.top_ = null;
  }

  /**
   * @override
   */
  asHtml(): {css: string, html: string} {
    let styles: string[] = [];
    if (this.bottom_ !== null) {
      styles.push(`bottom: ${this.bottom_}px;`);
    }

    if (this.left_ !== null) {
      styles.push(`left: ${this.left_}px;`);
    }

    if (this.right_ !== null) {
      styles.push(`right: ${this.right_}px;`);
    }

    if (this.top_ !== null) {
      styles.push(`top: ${this.top_}px;`);
    }

    styles.push(`background: url('${this.imageUrl_});`);
    styles.push(`background-size: contain;`);

    let html = `<div style="${styles.join('')}"></div>`;
    return {css: '', html};
  }

  /**
   * @return The bottom bounding box of the image layer, in px.
   */
  getBottom(): number | null {
    return this.bottom_;
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
  getLeft(): number | null {
    return this.left_;
  }

  /**
   * @return The right bounding box of the image layer, in px.
   */
  getRight(): number | null {
    return this.right_;
  }

  /**
   * @return The top bounding box of the image layer, in px.
   */
  getTop(): number | null {
    return this.top_;
  }

  /**
   * @param bottom The bottom of the bounding box to set, in px.
   */
  setBottom(bottom: number | null): void {
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
  setLeft(left: number | null): void {
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
  setRight(right: number | null): void {
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
  setTop(top: number | null): void {
    if (this.top_ === top) {
      return;
    }

    this.dispatch(DataEvents.CHANGED, () => {
      this.top_ = top;
    });
  }
}