import {Field} from 'external/gs_tools/src/data';
import {BaseListenable} from 'external/gs_tools/src/event';

import {DataEvents} from './data-events';
import {LayerType} from './layer-type';


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
   * @return The layer as HTML and CSS components.
   */
  abstract asHtml(): {css: string, html: string};

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
