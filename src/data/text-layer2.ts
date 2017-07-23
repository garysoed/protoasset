import { cache, Serializable } from 'external/gs_tools/src/data';
import { field } from 'external/gs_tools/src/datamodel';
import { EnumParser, StringParser } from 'external/gs_tools/src/parse';
import { Enums } from 'external/gs_tools/src/typescript';

import { Layer } from '../data/layer';
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
export abstract class TextLayer2 extends Layer {
  @field('color', StringParser) protected readonly color_: string;
  @field('fontFamily', StringParser) protected readonly fontFamily_: string;
  @field('fontUrl', StringParser) protected readonly fontUrl_: string | null;
  @field('fontWeight', StringParser) protected readonly fontWeight_: string | null;
  @field('hAlign', EnumParser(HorizontalAlign))
  protected readonly horizontalAlign_: HorizontalAlign;

  @field('size', StringParser) protected readonly size_: string;
  @field('text', StringParser) protected readonly text_: string;
  @field('vAlign', EnumParser(VerticalAlign)) protected readonly verticalAlign_: VerticalAlign;

  constructor() {
    super(LayerType.TEXT);
  }

  /**
   * @override
   */
  @cache()
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

  @cache()
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

  @cache()
  private createDiv_(parentStyles: string[]): string {
    const childStyles: string[] = [
      `text-align: ${Enums.toLowerCaseString(this.horizontalAlign_, HorizontalAlign)};`,
      `width: 100%;`,
    ];
    const childHtml = `<div style="${childStyles.join('')}">${this.text_}</div>`;

    return `<div style="${parentStyles.join('')}">${childHtml}</div>`;
  }

  /**
   * @return The correct 'align-items' value corresponding to the vertical align.
   */
  @cache()
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
   * @return The color of the font.
   */
  abstract getColor(): string;

  /**
   * @return The font family of the text.
   */
  abstract getFontFamily(): string;

  /**
   * @return The font URL of the text.
   */
  abstract getFontUrl(): string | null;

  /**
   * @return The font weight of the text.
   */
  abstract getFontWeight(): string | null;

  /**
   * @return The horizontal align of the text.
   */
  abstract getHorizontalAlign(): HorizontalAlign;

  /**
   * @return The size of the font.
   */
  abstract getSize(): string;

  /**
   * @return The URL of the image in the layer.
   */
  abstract getText(): string;

  /**
   * @return The vertical align of the text.
   */
  abstract getVerticalAlign(): VerticalAlign;

  /**
   * @param color Color of the font to set.
   */
  abstract setColor(color: string): TextLayer2;

  /**
   * @param fontFamily The font family of the text.
   */
  abstract setFontFamily(fontFamily: string): TextLayer2;

  /**
   * @param fontUrl URL of the font to use.
   */
  abstract setFontUrl(fontUrl: string | null): TextLayer2;

  /**
   * @param fontWeight The weight of the text.
   */
  abstract setFontWeight(fontWeight: string | null): TextLayer2;

  /**
   * @param align Horizontal alignment of the text.
   */
  abstract setHorizontalAlign(align: HorizontalAlign): TextLayer2;

  abstract setSize(size: string): TextLayer2;

  /**
   * @param text Text to display in the layer.
   */
  abstract setText(text: string): TextLayer2;

  /**
   * @param align Vertical alignment of the text.
   */
  abstract setVerticalAlign(align: VerticalAlign): TextLayer2;
}
