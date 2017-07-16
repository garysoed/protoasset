import { cache, Field, Serializable } from 'external/gs_tools/src/data';

import { DataModel } from 'external/gs_tools/src/datamodel';

import { DataSource } from '../data/data-source';

type SearchIndex<T> = {this: InMemoryDataSource2<T>};

/**
 * Data source where the data is stored in memory.
 */
@Serializable('inMemoryDataSource')
export class InMemoryDataSource2<T> implements DataModel<SearchIndex<T>>, DataSource<T> {
  @Field('data') private readonly data_: T;

  constructor(data: T) {
    this.data_ = data;
  }

  /**
   * @override
   */
  getData(): Promise<T> {
    return Promise.resolve(this.data_);
  }

  @cache()
  getSearchIndex(): SearchIndex<T> {
    return {this: this};
  }

  /**
   * Sets the data.
   * @param data The data to set.
   */
  setData(data: T): InMemoryDataSource2<T> {
    return new InMemoryDataSource2<T>(data);
  }

  /**
   * Create a new instance of the data source.
   * @param data The data.
   * @return The newly created data source.
   */
  static of<T>(data: T): InMemoryDataSource2<T> {
    return new InMemoryDataSource2<T>(data);
  }
}
