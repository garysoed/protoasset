import {Field, Serializable} from 'external/gs_tools/src/data';

import {BaseLayer} from './base-layer';
import {DataEvents} from './data-events';
import {LayerType} from './layer-type';


@Serializable('textLayer')
export class TextLayer extends BaseLayer {
  @Field('fontFamily') private fontFamily_: string;
  @Field('fontUrl') private fontUrl_: string | null;
  @Field('text') private text_: string;

  constructor(id: string, name: string) {
    super(id, name, LayerType.TEXT);
    this.fontFamily_ = 'Sans';
    this.fontUrl_ = null;
    this.text_ = '';
  }

  asActiveBoundaryPreviewHtml_(): {css: string, html: string} {
    return this.asHtml();
  }

  /**
   * @override
   */
  asHtml(): {css: string, html: string} {
    let css = this.fontUrl_ !== null ? `@import '${this.fontUrl_}';` : '';
    let styles: string[] = this.getBoxStyles_();
    styles.push(`font-family: ${this.fontFamily_};`);

    let html = `<div style="${styles.join('')}">${this.text_}</div>`;
    return {css, html};
  }

  asInactiveNormalPreviewHtml_(): {css: string, html: string} {
    return this.asHtml();
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
   * @return The URL of the image in the layer.
   */
  getText(): string {
    return this.text_;
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
}
