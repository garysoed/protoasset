import { Field, Serializable } from 'external/gs_tools/src/data';
import { Enums } from 'external/gs_tools/src/typescript';

import { BaseLayer } from '../data/base-layer';
import { DataEvents } from '../data/data-events';
import { LayerType } from '../data/layer-type';


export enum HorizontalAlign {
  LEFT,
  CENTER,
  RIGHT,
  JUSTIFY,
}


export enum VerticalAlign {
  TOP,
  CENTER,
  BOTTOM,
}


@Serializable('textLayer')
export class TextLayer extends BaseLayer {
  @Field('color') private color_: string;
  @Field('fontFamily') private fontFamily_: string;
  @Field('fontUrl') private fontUrl_: string | null;
  @Field('fontWeight') private fontWeight_: string | null;
  @Field('hAlign') private horizontalAlign_: HorizontalAlign;
  @Field('size') private size_: string;
  @Field('text') private text_: string;
  @Field('vAlign') private verticalAlign_: VerticalAlign;

  constructor(id: string, name: string) {
    super(id, name, LayerType.TEXT);
    this.color_ = 'black';
    this.fontFamily_ = 'Sans';
    this.fontUrl_ = null;
    this.fontWeight_ = null;
    this.horizontalAlign_ = HorizontalAlign.LEFT;
    this.size_ = '14px';
    this.text_ = '';
    this.verticalAlign_ = VerticalAlign.TOP;
  }

  /**
   * @override
   */
  asHtml(): {css: string, html: string} {
    const css = this.fontUrl_ !== null ? `@import url('${this.fontUrl_}');` : '';
    const parentStyles: string[] = this.getBoxStyles_().concat([
      `align-items: ${this.getAlignItems_()};`,
      `color: ${this.color_};`,
      `display: flex;`,
      `font-family: ${this.fontFamily_};`,
      `font-size: ${this.size_};`,
      `line-height: initial;`,
    ]);

    if (this.fontWeight_ !== null) {
      parentStyles.push(`font-weight: ${this.fontWeight_};`);
    }

    return {css, html: this.createDiv_(parentStyles)};
  }

  protected asInactiveNormalPreviewHtml_(): {css: string, html: string} {
    // TODO: Refactor this better.
    const css = this.fontUrl_ !== null ? `@import url('${this.fontUrl_}');` : '';
    const parentStyles: string[] = this.getBoxStyles_().concat([
      `align-items: ${this.getAlignItems_()};`,
      `color: ${this.color_};`,
      `display: flex;`,
      `font-family: ${this.fontFamily_};`,
      `font-size: ${this.size_};`,
      `filter: grayscale(50%);`,
      `line-height: initial;`,
      `opacity: .5;`,
    ]);

    if (this.fontWeight_ !== null) {
      parentStyles.push(`font-weight: ${this.fontWeight_};`);
    }

    return {css, html: this.createDiv_(parentStyles)};
  }

  /**
   * @param id ID of the layer copy to use.
   * @return Copy of the current layer with the given ID.
   */
  copy(id: string): TextLayer {
    const newLayer = new TextLayer(id, this.getName());
    this.copyInto_(newLayer);
    return newLayer;
  }

  /**
   * @override
   */
  protected copyInto_(targetLayer: TextLayer): void {
    super.copyInto_(targetLayer);
    targetLayer.setColor(this.getColor());
    targetLayer.setFontFamily(this.getFontFamily());
    targetLayer.setFontUrl(this.getFontUrl());
    targetLayer.setFontWeight(this.getFontWeight());
    targetLayer.setHorizontalAlign(this.getHorizontalAlign());
    targetLayer.setSize(this.getSize());
    targetLayer.setText(this.getText());
    targetLayer.setVerticalAlign(this.getVerticalAlign());
  }

  private createDiv_(parentStyles: string[]): string {
    const childStyles: string[] = [
      `text-align: ${Enums.toLowerCaseString(this.horizontalAlign_, HorizontalAlign)};`,
      `width: 100%;`,
    ];
    const childHtml = `<div style="${childStyles.join('')}">${this.text_}</div>`;

    return `<div style="${parentStyles.join('')}">${childHtml}</div>`;
  }

  /**
   * @return The color of the font.
   */
  getColor(): string {
    return this.color_;
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
   * @return The font weight of the text.
   */
  getFontWeight(): string | null {
    return this.fontWeight_;
  }

  /**
   * @return The horizontal align of the text.
   */
  getHorizontalAlign(): HorizontalAlign {
    return this.horizontalAlign_;
  }

  /**
   * @return The correct 'align-items' value corresponding to the vertical align.
   */
  private getAlignItems_(): string {
    switch (this.verticalAlign_) {
      case VerticalAlign.BOTTOM:
        return 'flex-end';
      case VerticalAlign.CENTER:
        return 'center';
      case VerticalAlign.TOP:
        return 'flex-start';
    }
  }

  /**
   * @return The size of the font.
   */
  getSize(): string {
    return this.size_;
  }

  /**
   * @return The URL of the image in the layer.
   */
  getText(): string {
    return this.text_;
  }

  /**
   * @return The vertical align of the text.
   */
  getVerticalAlign(): VerticalAlign {
    return this.verticalAlign_;
  }

  /**
   * @param color Color of the font to set.
   */
  setColor(color: string): void {
    if (this.color_ === color) {
      return;
    }

    this.dispatch(DataEvents.CHANGED, () => {
      this.color_ = color;
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
   * @param fontWeight The weight of the text.
   */
  setFontWeight(fontWeight: string | null): void {
    if (this.fontWeight_ === fontWeight) {
      return;
    }

    this.dispatch(DataEvents.CHANGED, () => {
      this.fontWeight_ = fontWeight;
    });
  }

  /**
   * @param align Horizontal alignment of the text.
   */
  setHorizontalAlign(align: HorizontalAlign): void {
    if (this.horizontalAlign_ === align) {
      return;
    }

    this.dispatch(DataEvents.CHANGED, () => {
      this.horizontalAlign_ = align;
    });
  }

  setSize(size: string): void {
    if (this.size_ === size) {
      return;
    }

    this.dispatch(DataEvents.CHANGED, () => {
      this.size_ = size;
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
   * @param align Vertical alignment of the text.
   */
  setVerticalAlign(align: VerticalAlign): void {
    if (this.verticalAlign_ === align) {
      return;
    }

    this.dispatch(DataEvents.CHANGED, () => {
      this.verticalAlign_ = align;
    });
  }
}
