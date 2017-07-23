import { cache, Serializable } from 'external/gs_tools/src/data';
import { DataModel, field } from 'external/gs_tools/src/datamodel';
import { Parser } from 'external/gs_tools/src/interfaces';
import { StringParser } from 'external/gs_tools/src/parse';

import { DataSource } from '../data/data-source';

type SearchIndex<T> = {this: InMemoryDataSource2<T>};

/**
 * Data source where the data is stored in memory.
 */
@Serializable('inMemoryDataSource')
export abstract class InMemoryDataSource2<T> implements DataModel<SearchIndex<T>>, DataSource<T> {
  @field('unparsedData', StringParser) protected readonly unparsedData_: string;

  constructor(private readonly parser_: Parser<T>) { }

  /**
   * @override
   */
  async getData(): Promise<T> {
    const unparsedData = await this.loadUnparsedData();
    const data = this.parser_.parse(unparsedData);
    if (!data) {
      throw new Error('data cannot be found / parsed');
    }
    return data;
  }

  @cache()
  getSearchIndex(): SearchIndex<T> {
    return {this: this};
  }

  protected abstract loadUnparsedData(): Promise<string>;

  /**
   * Sets the data.
   * @param data The data to set.
   */
  abstract setData(data: T): InMemoryDataSource2<T>;
}
