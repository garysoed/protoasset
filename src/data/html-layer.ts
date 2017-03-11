import { Field, Serializable } from 'external/gs_tools/src/data';

import { BaseLayer } from '../data/base-layer';
import { DataEvents } from '../data/data-events';
import { LayerType } from '../data/layer-type';


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
  asActiveBoundaryPreviewHtml_(): {css: string, html: string} {
    return this.asHtml();
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
   * @override
   */
  asInactiveNormalPreviewHtml_(): {css: string, html: string} {
    return this.asHtml();
  }

  /**
   * Creates a copy of the current layer.
   * @param id ID of the layer copy.
   * @return Copy of the current layer.
   */
  copy(id: string): HtmlLayer {
    const newLayer = new HtmlLayer(id, this.getName());
    this.copyInto_(newLayer);
    return newLayer;
  }

  /**
   * @override
   */
  protected copyInto_(targetLayer: HtmlLayer): void {
    super.copyInto_(targetLayer);
    targetLayer.setCss(this.getCss());
    targetLayer.setHtml(this.getHtml());
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
