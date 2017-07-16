import { cache, Field } from 'external/gs_tools/src/data';

import { DataModel } from '../data/data-model';
import { LayerPreviewMode } from '../data/layer-preview-mode';
import { LayerType } from '../data/layer-type';

type HtmlRender = {css: string, html: string};
type SearchIndex = {name: string, this: Layer};

/**
 * Base class of all layers.
 */
export abstract class Layer implements DataModel<SearchIndex> {
  @Field('bottom') private readonly bottom_: number;
  @Field('id') private readonly id_: string;
  @Field('left') private readonly left_: number;
  @Field('name') private readonly name_: string;
  @Field('right') private readonly right_: number;
  @Field('top') private readonly top_: number;

  private readonly type_: LayerType;

  /**
   * @param name Name of the layer.
   */
  constructor(
      id: string,
      name: string,
      type: LayerType,
      bottom: number,
      left: number,
      right: number,
      top: number) {
    this.bottom_ = bottom;
    this.id_ = id;
    this.left_ = left;
    this.name_ = name;
    this.right_ = right;
    this.top_ = top;
    this.type_ = type;
  }

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
  getBottom(): number {
    return this.bottom_;
  }

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
  getId(): string {
    return this.id_;
  }

  /**
   * @return The left bounding box of the image layer, in px.
   */
  getLeft(): number {
    return this.left_;
  }

  /**
   * @return Name of the layer.
   */
  getName(): string {
    return this.name_;
  }

  /**
   * @return The right bounding box of the image layer, in px.
   */
  getRight(): number {
    return this.right_;
  }

  abstract getSearchIndex(): SearchIndex;

  /**
   * @return The top bounding box of the image layer, in px.
   */
  getTop(): number {
    return this.top_;
  }

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
