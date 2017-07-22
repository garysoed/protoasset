import { cache, Serializable } from 'external/gs_tools/src/data';
import { DataModel, field } from 'external/gs_tools/src/datamodel';

import { DataSource } from '../data/data-source';

type SearchIndex<T> = {this: InMemoryDataSource2<T>};

/**
 * Data source where the data is stored in memory.
 */
@Serializable('inMemoryDataSource')
export abstract class InMemoryDataSource2<T> implements DataModel<SearchIndex<T>>, DataSource<T> {
  @field('data') protected readonly data_: T;

  constructor(data: T) {
    this.data_ = data;
  }

  /**
   * @override
   */
  abstract getData(): Promise<T>;

  @cache()
  getSearchIndex(): SearchIndex<T> {
    return {this: this};
  }

  /**
   * Sets the data.
   * @param data The data to set.
   */
  abstract setData(data: T): InMemoryDataSource2<T>;
}
