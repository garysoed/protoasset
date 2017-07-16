import { cache, Field, Serializable } from 'external/gs_tools/src/data';
import { DataModel } from 'external/gs_tools/src/datamodel';
import { ImmutableList } from 'external/gs_tools/src/immutable';

type SearchIndex = {name: string, this: Helper2};

/**
 * Represents a Handlebars helper function.
 */
@Serializable('helper')
export class Helper2 implements DataModel<SearchIndex> {
  @Field('args') private readonly args_: ImmutableList<string>;
  @Field('fnString') private readonly body_: string;
  @Field('id') private readonly id_: string;
  @Field('name') private readonly name_: string;

  constructor(
      id: string,
      name: string,
      args: ImmutableList<string> = ImmutableList.of(['a', 'b']),
      body: string = 'return a + b') {
    this.args_ = args;
    this.body_ = body;
    this.id_ = id;
    this.name_ = name;
  }

  /**
   * @return The helper as a function object.
   */
  @cache()
  asFunction(): (...args: any[]) => any {
    return Function.apply(this, this.args_.toArray().concat([this.body_]));
  }

  /**
   * @return Arguments of the function.
   */
  getArgs(): ImmutableList<string> {
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

  @cache()
  getSearchIndex(): SearchIndex {
    return {name: this.name_, this: this};
  }

  /**
   * @param args Arguments of the helper function.
   */
  setArgs(args: ImmutableList<string>): Helper2 {
    return new Helper2(
        this.id_,
        this.name_,
        args,
        this.body_);
  }

  /**
   * @param body Body of the helper.
   */
  setBody(body: string): Helper2 {
    return new Helper2(
        this.id_,
        this.name_,
        this.args_,
        body);
  }

  /**
   * @param name Name of the helper.
   */
  setName(name: string): Helper2 {
    return new Helper2(
        this.id_,
        name,
        this.args_,
        this.body_);
  }

  /**
   * @param id ID of the helper.
   * @param name Name of the helper.
   * @return A new instance of the helper object.
   */
  static of(id: string, name: string): Helper2 {
    return new Helper2(id, name);
  }
}
