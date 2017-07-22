import { cache } from 'external/gs_tools/src/data';
import { DataModel, field } from 'external/gs_tools/src/datamodel';

import { LayerPreviewMode } from '../data/layer-preview-mode';
import { LayerType } from '../data/layer-type';

type HtmlRender = {css: string, html: string};
type SearchIndex = {name: string, this: Layer};

/**
 * Base class of all layers.
 */
export abstract class Layer implements DataModel<SearchIndex> {
  @field('bottom') protected readonly bottom_: number;
  @field('id') protected readonly id_: string;
  @field('left') protected readonly left_: number;
  @field('name') protected readonly name_: string;
  @field('right') protected readonly right_: number;
  @field('top') protected readonly top_: number;

  /**
   * @param name Name of the layer.
   */
  constructor(protected readonly type_: LayerType) { }

  /**
   * @return The layer as HTML and CSS components when the layer is actively previewe in BOUNDARY
   *     mode.
   */
  @cache()
  protected asActiveBoundaryPreviewHtml_(): {css: string, html: string} {
    const styles: string[] = this.getBoxStyles_().concat([
      `background-color: var(--gsThemeNormal);`,
    ]);
    const html = `<div style="${styles.join('')}"></div>`;
    return {css: '', html};
  }

  /**
   * @return The layer as HTML and CSS components.
   */
  abstract asHtml(): HtmlRender;

  /**
   * @return The layer as HTML and CSS components when the layer is not actively previewed in
   *     NORMAL mode.
   */
  protected abstract asInactiveNormalPreviewHtml_(): HtmlRender;

  /**
   * @param mode Preview mode to return.
   * @param isActive True iff the layer is currently actively previewed.
   * @return The layer as HTML and CSS components in preview mode.
   */
  @cache()
  asPreviewHtml(mode: LayerPreviewMode, isActive: boolean): HtmlRender {
    switch (mode) {
      case LayerPreviewMode.BOUNDARY:
        return isActive ? this.asActiveBoundaryPreviewHtml_() : this.asInactiveNormalPreviewHtml_();
      case LayerPreviewMode.FULL:
        return this.asHtml();
      case LayerPreviewMode.NORMAL:
        return isActive ? this.asHtml() : this.asInactiveNormalPreviewHtml_();
      default:
        throw new Error(`Unsuppored layer preview mode: ${mode}`);
    }
  }

  /**
   * @return The bottom bounding box of the image layer, in px.
   */
  abstract getBottom(): number;

  /**
   * @return Array of styles based on the boundary box top, left, bottom, right.
   */
  @cache()
  protected getBoxStyles_(): string[] {
    return [
      `bottom: ${this.bottom_}px;`,
      `left: ${this.left_}px;`,
      `right: ${this.right_}px;`,
      `top: ${this.top_}px;`,
      `position: absolute;`,
    ];
  }

  /**
   * @return ID of the layer.
   */
  abstract getId(): string;

  /**
   * @return The left bounding box of the image layer, in px.
   */
  abstract getLeft(): number;

  /**
   * @return Name of the layer.
   */
  abstract getName(): string;

  /**
   * @return The right bounding box of the image layer, in px.
   */
  abstract getRight(): number;

  @cache()
  getSearchIndex(): SearchIndex {
    return {
      name: this.name_,
      this: this,
    };
  }

  /**
   * @return The top bounding box of the image layer, in px.
   */
  abstract getTop(): number;

  /**
   * @return Type of the layer.
   */
  getType(): LayerType {
    return this.type_;
  }

  /**
   * @param bottom The bottom of the bounding box to set, in px.
   */
  abstract setBottom(bottom: number): this;

  /**
   * @param left The left of the bounding box to set, in px.
   */
  abstract setLeft(left: number): this;

  /**
   * Sets the name of the layer.
   *
   * @param name The name to set.
   */
  abstract setName(name: string): this;

  /**
   * @param right The right of the bounding box to set, in px.
   */
  abstract setRight(right: number): this;

  /**
   * @param top The top of the bounding box to set, in px.
   */
  abstract setTop(top: number): this;
}
