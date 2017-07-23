import { cache, Serializable } from 'external/gs_tools/src/data';
import { DataModel, field } from 'external/gs_tools/src/datamodel';
import { ImmutableList } from 'external/gs_tools/src/immutable';
import { DataModelParser, IntegerParser } from 'external/gs_tools/src/parse';

import { DataSource } from '../data/data-source';
import { DataSource2 } from '../data/data-source2';

type SearchIndex = {this: TsvDataSource2};

@Serializable('tsvDataSource')
export abstract class TsvDataSource2 implements DataModel<SearchIndex>,
    DataSource<ImmutableList<ImmutableList<string>>> {
  @field('endRow', IntegerParser) protected readonly endRow_: number;
  @field('innerSource', DataModelParser<DataSource2<string>>())
  protected readonly innerSource_: DataSource<string>;

  @field('startRow', IntegerParser) protected readonly startRow_: number;

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

  abstract getEndRow(): number;

  @cache()
  getSearchIndex(): SearchIndex {
    return {this: this};
  }

  abstract getStartRow(): number;

  /**
   * @param row The last row to include in the returned data.
   */
  abstract setEndRow(row: number): TsvDataSource2;

  /**
   * @param row The first row to include in the returned data.
   */
  abstract setStartRow(row: number): TsvDataSource2;
}
