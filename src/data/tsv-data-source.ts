import { Field, Serializable } from 'external/gs_tools/src/data';
import { ImmutableList } from 'external/gs_tools/src/immutable';

import { DataSource } from '../data/data-source';


@Serializable('tsvDataSource')
export class TsvDataSource implements DataSource<string[][]> {
  private cache_: string[][] | null;
  private cachedInnerSourceData_: string | null;
  @Field('endRow') private endRow_: number;
  @Field('innerSource') private innerSource_: DataSource<string>;
  @Field('startRow') private startRow_: number;

  constructor(innerSource: DataSource<string>, startRow: number, endRow: number) {
    this.endRow_ = endRow;
    this.innerSource_ = innerSource;
    this.startRow_ = startRow;
    this.cache_ = null;
    this.cachedInnerSourceData_ = null;
  }

  /**
   * @override
   */
  async getData(): Promise<string[][]> {
    const data = await this.innerSource_.getData();
    if (this.cache_ === null || data !== this.cachedInnerSourceData_) {
      const tsvData = this.parseData_(data);
      this.cache_ = tsvData;
      this.cachedInnerSourceData_ = data;
      return tsvData;
    } else {
      return this.cache_;
    }
  }

  /**
   * Parses the given the data.
   *
   * @param data The data to parse.
   * @return The parsed data.
   */
  parseData_(data: string): string[][] {
    const list = ImmutableList
        .of(data.split('\n'))
        .map((line: string) => {
          return line.split('\t');
        })
        .filter((_: string[], index: number) => {
          return index >= this.startRow_ && index <= this.endRow_;
        });
    return [...list];
  }

  /**
   * @param row The last row to include in the returned data.
   */
  setEndRow(row: number): void {
    this.endRow_ = row;
  }

  /**
   * @param row The first row to include in the returned data.
   */
  setStartRow(row: number): void {
    this.startRow_ = row;
  }

  /**
   * @param innerSource The inner data source.
   * @param startRow The first row to include in the returned data.
   * @param endRow The last row to include in the returned data.
   * @return The new instance of the data source.
   */
  static of(innerSource: DataSource<string>, startRow: number, endRow: number): TsvDataSource {
    return new TsvDataSource(innerSource, startRow, endRow);
  }
}
// TODO: Mutable
