import {Field, Serializable} from 'external/gs_tools/src/data';
import {BaseListenable} from 'external/gs_tools/src/event';

import {DataEvents} from './data-events';


/**
 * Represents a Handlebars helper function.
 */
@Serializable('helper')
export class Helper extends BaseListenable<DataEvents> {
  @Field('args') private args_: string[];
  @Field('id') private id_: string;
  @Field('name') private name_: string;
  @Field('fnString') private body_: string;

  constructor(id: string, name: string) {
    super();
    this.args_ = ['a', 'b'];
    this.body_ = 'return a + b';
    this.id_ = id;
    this.name_ = name;
  }

  /**
   * @return The helper as a function object.
   */
  asFunction(): (...args: any[]) => any {
    return Function.apply(this, this.args_.concat([this.body_]));
  }

  /**
   * @return Arguments of the function.
   */
  getArgs(): string[] {
    return this.args_;
  }

  /**
   * @return The body of the function, as string.
   */
  getBody(): string {
    return this.body_;
  }

  /**
   * @return ID of the helper.
   */
  getId(): string {
    return this.id_;
  }

  /**
   * @return Name of the helper.
   */
  getName(): string {
    return this.name_;
  }

  /**
   * @param args Arguments of the helper function.
   */
  setArgs(args: string[]): void {
    this.dispatch(DataEvents.CHANGED, () => {
      this.args_ = args;
    });
  }

  /**
   * @param body Body of the helper.
   */
  setBody(body: string): void {
    if (body === this.body_) {
      return;
    }

    this.dispatch(DataEvents.CHANGED, () => {
      this.body_ = body;
    });
  }

  /**
   * @param name Name of the helper.
   */
  setName(name: string): void {
    if (name === this.name_) {
      return;
    }

    this.dispatch(DataEvents.CHANGED, () => {
      this.name_ = name;
    });
  }

  /**
   * @param id ID of the helper.
   * @param name Name of the helper.
   * @return A new instance of the helper object.
   */
  static of(id: string, name: string): Helper {
    return new Helper(id, name);
  }
}
