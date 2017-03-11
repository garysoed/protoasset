import { Field } from 'external/gs_tools/src/data';
import { BaseListenable } from 'external/gs_tools/src/event';
import { Validate } from 'external/gs_tools/src/valid';

import { DataEvents } from '../data/data-events';
import { LayerPreviewMode } from '../data/layer-preview-mode';
import { LayerType } from '../data/layer-type';


type HtmlRender = {css: string, html: string};


/**
 * Base class of all layers.
 */
export abstract class BaseLayer extends BaseListenable<DataEvents> {
  @Field('id') private id_: string;
  @Field('name') private name_: string;
  @Field('bottom') private bottom_: number;
  @Field('left') private left_: number;
  @Field('right') private right_: number;
  @Field('top') private top_: number;

  private readonly type_: LayerType;

  /**
   * @param name Name of the layer.
   */
  constructor(id: string, name: string, type: LayerType) {
    super();
    this.bottom_ = 0;
    this.id_ = id;
    this.left_ = 0;
    this.name_ = name;
    this.right_ = 0;
    this.top_ = 0;
    this.type_ = type;
  }

  /**
   * @return The layer as HTML and CSS components when the layer is actively previewe in BOUNDARY
   *     mode.
   */
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
  asPreviewHtml(mode: LayerPreviewMode, isActive: boolean): HtmlRender {
    switch (mode) {
      case LayerPreviewMode.BOUNDARY:
        return isActive ? this.asActiveBoundaryPreviewHtml_() : this.asInactiveNormalPreviewHtml_();
      case LayerPreviewMode.FULL:
        return this.asHtml();
      case LayerPreviewMode.NORMAL:
        return isActive ? this.asHtml() : this.asInactiveNormalPreviewHtml_();
      default:
        throw Validate.fail(`Unsuppored layer preview mode: ${mode}`);
    }
  }

  /**
   * Copy this layer's data to the given layer.
   * @param target Layer to copy the data of this layer into.
   */
  protected copyInto_(target: BaseLayer): void {
    target.setBottom(this.getBottom());
    target.setLeft(this.getLeft());
    target.setRight(this.getRight());
    target.setTop(this.getTop());
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
  setBottom(bottom: number): void {
    if (this.bottom_ === bottom) {
      return;
    }

    this.dispatch(DataEvents.CHANGED, () => {
      this.bottom_ = bottom;
    });
  }

  /**
   * @param left The left of the bounding box to set, in px.
   */
  setLeft(left: number): void {
    if (this.left_ === left) {
      return;
    }

    this.dispatch(DataEvents.CHANGED, () => {
      this.left_ = left;
    });
  }

  /**
   * Sets the name of the layer.
   *
   * @param name The name to set.
   */
  setName(name: string): void {
    if (this.name_ === name) {
      return;
    }

    this.dispatch(DataEvents.CHANGED, () => {
      this.name_ = name;
    });
  }

  /**
   * @param right The right of the bounding box to set, in px.
   */
  setRight(right: number): void {
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
  setTop(top: number): void {
    if (this.top_ === top) {
      return;
    }

    this.dispatch(DataEvents.CHANGED, () => {
      this.top_ = top;
    });
  }
}
