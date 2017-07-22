import { cache, Serializable } from 'external/gs_tools/src/data';
import { DataModel, DataModels, field } from 'external/gs_tools/src/datamodel';
import { ImmutableList, ImmutableMap } from 'external/gs_tools/src/immutable';

type SearchIndex = {name: string, this: Helper2};

/**
 * Represents a Handlebars helper function.
 */
@Serializable('helper')
export abstract class Helper2 implements DataModel<SearchIndex> {
  @field('args') protected readonly args_: ImmutableList<string> = ImmutableList.of(['a', 'b']);
  @field('fnString') protected readonly body_: string = 'return a + b';
  @field('id') protected readonly id_: string;
  @field('name') protected readonly name_: string;

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
  abstract getArgs(): ImmutableList<string>;

  /**
   * @return The body of the function, as string.
   */
  abstract getBody(): string;

  /**
   * @return ID of the helper.
   */
  abstract getId(): string;

  /**
   * @return Name of the helper.
   */
  abstract getName(): string;

  @cache()
  getSearchIndex(): SearchIndex {
    return {name: this.name_, this: this};
  }

  /**
   * @param args Arguments of the helper function.
   */
  abstract setArgs(args: ImmutableList<string>): Helper2;

  /**
   * @param body Body of the helper.
   */
  abstract setBody(body: string): Helper2;

  /**
   * @param name Name of the helper.
   */
  abstract setName(name: string): Helper2;

  static withId(id: string): Helper2 {
    return DataModels.newInstance<Helper2>(
        Helper2,
        ImmutableMap.of([['id_', id]]));
  }
}
