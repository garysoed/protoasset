import { cache, Field, Serializable } from 'external/gs_tools/src/data';
import { ImmutableList } from 'external/gs_tools/src/immutable';

import { DataModel } from '../data/data-model';
import { DataSource } from '../data/data-source';

type SearchIndex = {this: TsvDataSource2};

@Serializable('tsvDataSource')
export class TsvDataSource2 implements DataModel<SearchIndex>,
    DataSource<ImmutableList<ImmutableList<string>>> {
  @Field('endRow') private readonly endRow_: number;
  @Field('innerSource') private readonly innerSource_: DataSource<string>;
  @Field('startRow') private readonly startRow_: number;

  constructor(innerSource: DataSource<string>, startRow: number, endRow: number) {
    this.endRow_ = endRow;
    this.innerSource_ = innerSource;
    this.startRow_ = startRow;
  }

  /**
   * @override
   */
  @cache()
  async getData(): Promise<ImmutableList<ImmutableList<string>>> {
    const data = await this.innerSource_.getData();
    return ImmutableList
        .of(data.split('\n'))
        .map((line: string) => {
          return ImmutableList.of(line.split('\t'));
        })
        .filter((_: ImmutableList<string>, index: number) => {
          return index >= this.startRow_ && index <= this.endRow_;
        });
  }

  @cache()
  getSearchIndex(): SearchIndex {
    return {this: this};
  }

  /**
   * @param row The last row to include in the returned data.
   */
  setEndRow(row: number): TsvDataSource2 {
    return new TsvDataSource2(this.innerSource_, this.startRow_, row);
  }

  /**
   * @param row The first row to include in the returned data.
   */
  setStartRow(row: number): TsvDataSource2 {
    return new TsvDataSource2(this.innerSource_, row, this.endRow_);
  }

  /**
   * @param innerSource The inner data source.
   * @param startRow The first row to include in the returned data.
   * @param endRow The last row to include in the returned data.
   * @return The new instance of the data source.
   */
  static of(innerSource: DataSource<string>, startRow: number, endRow: number): TsvDataSource2 {
    return new TsvDataSource2(innerSource, startRow, endRow);
  }
}
