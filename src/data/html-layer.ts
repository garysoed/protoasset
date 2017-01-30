import {Field, Serializable} from 'external/gs_tools/src/data';

import {BaseLayer} from './base-layer';
import {DataEvents} from './data-events';
import {LayerType} from './layer-type';


@Serializable('htmlLayer')
export class HtmlLayer extends BaseLayer {
  @Field('css') private css_: string;
  @Field('html') private html_: string;

  constructor(id: string, name: string) {
    super(id, name, LayerType.HTML);
    this.css_ = '';
    this.html_ = '';
  }

  /**
   * @override
   */
  asHtml(): {css: string, html: string} {
    return {
      css: this.css_,
      html: this.html_,
    };
  }

  /**
   * @return The CSS part of the HTML.
   */
  getCss(): string {
    return this.css_;
  }

  /**
   * @return The HTML part.
   */
  getHtml(): string {
    return this.html_;
  }

  /**
   * @param css The CSS part to set.
   */
  setCss(css: string): void {
    if (this.css_ === css) {
      return;
    }

    this.dispatch(DataEvents.CHANGED, () => {
      this.css_ = css;
    });
  }

  /**
   * @param html The HTML part to set.
   */
  setHtml(html: string): void {
    if (this.html_ === html) {
      return;
    }

    this.dispatch(DataEvents.CHANGED, () => {
      this.html_ = html;
    });
  }
}
