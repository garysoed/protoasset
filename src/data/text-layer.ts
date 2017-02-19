import {Field, Serializable} from 'external/gs_tools/src/data';

import {BaseLayer} from './base-layer';
import {DataEvents} from './data-events';
import {LayerType} from './layer-type';


@Serializable('textLayer')
export class TextLayer extends BaseLayer {
  @Field('bottom') private bottom_: number | null;
  @Field('fontFamily') private fontFamily_: string;
  @Field('fontUrl') private fontUrl_: string | null;
  @Field('left') private left_: number | null;
  @Field('right') private right_: number | null;
  @Field('text') private text_: string;
  @Field('top') private top_: number | null;

  constructor(id: string, name: string) {
    super(id, name, LayerType.TEXT);
    this.bottom_ = null;
    this.fontFamily_ = 'Sans';
    this.fontUrl_ = null;
    this.left_ = null;
    this.right_ = null;
    this.text_ = '';
    this.top_ = null;
  }

  asActiveBoundaryPreviewHtml_(): {css: string, html: string} {
    return this.asHtml();
  }

  /**
   * @override
   */
  asHtml(): {css: string, html: string} {
    let css = this.fontUrl_ !== null ? `@import '${this.fontUrl_}';` : '';
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
    styles.push(`font-family: ${this.fontFamily_};`);

    let html = `<div style="${styles.join('')}">${this.text_}</div>`;
    return {css, html};
  }

  asInactiveNormalPreviewHtml_(): {css: string, html: string} {
    return this.asHtml();
  }

  /**
   * @return The bottom bounding box of the image layer, in px.
   */
  getBottom(): number | null {
    return this.bottom_;
  }

  /**
   * @return The font family of the text.
   */
  getFontFamily(): string {
    return this.fontFamily_;
  }

  /**
   * @return The font URL of the text.
   */
  getFontUrl(): string | null {
    return this.fontUrl_;
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
   * @return The URL of the image in the layer.
   */
  getText(): string {
    return this.text_;
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
   * @param fontFamily The font family of the text.
   */
  setFontFamily(fontFamily: string): void {
    if (this.fontFamily_ === fontFamily) {
      return;
    }

    this.dispatch(DataEvents.CHANGED, () => {
      this.fontFamily_ = fontFamily;
    });
  }

  /**
   * @param fontUrl URL of the font to use.
   */
  setFontUrl(fontUrl: string | null): void {
    if (this.fontUrl_ === fontUrl) {
      return;
    }

    this.dispatch(DataEvents.CHANGED, () => {
      this.fontUrl_ = fontUrl;
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
   * @param text Text to display in the layer.
   */
  setText(text: string): void {
    if (this.text_ === text) {
      return;
    }

    this.dispatch(DataEvents.CHANGED, () => {
      this.text_ = text;
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
