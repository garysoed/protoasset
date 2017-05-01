import { Field, Serializable } from 'external/gs_tools/src/data';

import { IDataSource } from './i-data-source';


/**
 * Data source where the data is stored in memory.
 */
@Serializable('inMemoryDataSource')
export class InMemoryDataSource<T> implements IDataSource<T> {
  @Field('data') private data_: T;

  /**
   * @override
   */
  getData(): Promise<T> {
    return Promise.resolve(this.data_);
  }

  /**
   * Sets the data.
   * @param data The data to set.
   */
  setData(data: T): void {
    this.data_ = data;
  }

  /**
   * Create a new instance of the data source.
   * @param data The data.
   * @return The newly created data source.
   */
  static of<T>(data: T): InMemoryDataSource<T> {
    const source = new InMemoryDataSource<T>();
    source.data_ = data;
    return source;
  }
}
