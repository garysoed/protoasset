import {Arrays} from 'external/gs_tools/src/collection';
import {Field, Serializable} from 'external/gs_tools/src/data';

import {IDataSource} from './i-data-source';


@Serializable('tsvDataSource')
export class TsvDataSource implements IDataSource<string[][]> {
  @Field('innerSource') private innerSource_: IDataSource<string>;
  @Field('startRow') private startRow_: number;
  @Field('endRow') private endRow_: number;

  private cache_: string[][] | null;
  private cachedInnerSourceData_: string | null;

  constructor(innerSource: IDataSource<string>, startRow: number, endRow: number) {
    this.endRow_ = endRow;
    this.innerSource_ = innerSource;
    this.startRow_ = startRow;
    this.cache_ = null;
    this.cachedInnerSourceData_ = null;
  }

  /**
   * Parses the given the data.
   *
   * @param data The data to parse.
   * @return The parsed data.
   */
  parseData_(data: string): string[][] {
    return Arrays
        .of(data.split('\n'))
        .map((line: string) => {
          return line.split('\t');
        })
        .filterElement((value: string[], index: number) => {
          return index >= this.startRow_ && index <= this.endRow_;
        })
        .asArray();
  }

  /**
   * @override
   */
  getData(): Promise<string[][]> {
    return this.innerSource_
        .getData()
        .then((data: string) => {
          if (this.cache_ === null || data !== this.cachedInnerSourceData_) {
            let tsvData = this.parseData_(data);
            this.cache_ = tsvData;
            this.cachedInnerSourceData_ = data;
            return tsvData;
          } else {
            return this.cache_;
          }
        });
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
  static of(innerSource: IDataSource<string[][]>, startRow: number, endRow: number): TsvDataSource {
    return new TsvDataSource(innerSource, startRow, endRow);
  }
}