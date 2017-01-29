import {Field} from 'external/gs_tools/src/data';
import {BaseListenable} from 'external/gs_tools/src/event';

import {DataEvents} from './data-events';


/**
 * Base class of all layers.
 */
export abstract class BaseLayer extends BaseListenable<DataEvents> {
  @Field('name') private name_: string;

  /**
   * @param name Name of the layer.
   */
  constructor(name: string) {
    super();
    this.name_ = name;
  }

  /**
   * @return The layer as HTML and CSS components.
   */
  abstract asHtml(): {css: string, html: string};

  /**
   * @return Name of the layer.
   */
  getName(): string {
    return this.name_;
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
