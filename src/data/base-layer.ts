import {Field} from 'external/gs_tools/src/data';
import {BaseListenable} from 'external/gs_tools/src/event';
import {Validate} from 'external/gs_tools/src/valid';

import {DataEvents} from './data-events';
import {LayerPreviewMode} from './layer-preview-mode';
import {LayerType} from './layer-type';


type HtmlRender = {css: string, html: string};


/**
 * Base class of all layers.
 */
export abstract class BaseLayer extends BaseListenable<DataEvents> {
  @Field('id') private id_: string;
  @Field('name') private name_: string;

  private readonly type_: LayerType;

  /**
   * @param name Name of the layer.
   */
  constructor(id: string, name: string, type: LayerType) {
    super();
    this.id_ = id;
    this.name_ = name;
    this.type_ = type;
  }

  /**
   * @return The layer as HTML and CSS components when the layer is actively previewe in BOUNDARY
   *     mode.
   */
  protected abstract asActiveBoundaryPreviewHtml_(): HtmlRender;

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
      case LayerPreviewMode.NORMAL:
        return isActive ? this.asHtml() : this.asInactiveNormalPreviewHtml_();
      case LayerPreviewMode.BOUNDARY:
        return isActive ? this.asActiveBoundaryPreviewHtml_() : this.asInactiveNormalPreviewHtml_();
      default:
        throw Validate.fail(`Unsuppored layer preview mode: ${mode}`);
    }
  }

  /**
   * @return ID of the layer.
   */
  getId(): string {
    return this.id_;
  }

  /**
   * @return Name of the layer.
   */
  getName(): string {
    return this.name_;
  }

  /**
   * @return Type of the layer.
   */
  getType(): LayerType {
    return this.type_;
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
}
