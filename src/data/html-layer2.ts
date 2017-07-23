import { cache, Serializable } from 'external/gs_tools/src/data';
import { field } from 'external/gs_tools/src/datamodel';
import { ImmutableList } from 'external/gs_tools/src/immutable';
import { StringParser } from 'external/gs_tools/src/parse';

import { Layer } from 'src/data/layer';
import { LayerType } from '../data/layer-type';

@Serializable('htmlLayer')
export abstract class HtmlLayer2 extends Layer {
  @field('css', StringParser) protected readonly css_: string;
  @field('html', StringParser) protected readonly html_: string;

  constructor() {
    super(LayerType.HTML);
  }

  /**
   * @override
   */
  @cache()
  asHtml(): {css: string, html: string} {
    const styles = this.getBoxStyles_();
    return {
      css: this.css_,
      html: `<div style="${styles.join('')}">${this.html_}</div>`,
    };
  }

  /**
   * @override
   */
  @cache()
  asInactiveNormalPreviewHtml_(): {css: string, html: string} {
    const styles = ImmutableList.of(this.getBoxStyles_())
        .addAll(ImmutableList.of(['filter: grayscale(50%);', 'opacity: .5;']))
        .toArray();
    return {
      css: this.css_,
      html: `<div style="${styles.join('')}">${this.html_}</div>`,
    };
  }

  /**
   * @return The CSS part of the HTML.
   */
  abstract getCss(): string;

  /**
   * @return The HTML part.
   */
  abstract getHtml(): string;

  /**
   * @param css The CSS part to set.
   */
  abstract setCss(css: string): HtmlLayer2;

  /**
   * @param html The HTML part to set.
   */
  abstract setHtml(html: string): HtmlLayer2;
}
