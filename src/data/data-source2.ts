/**
 * Represents a source of data.
 *
 * @param <T> Type of the data.
 */
import { DataModel } from 'external/gs_tools/src/datamodel';

export type DataSourceIndex<T> = {this: DataSource2<T>};

export interface DataSource2<T> extends DataModel<DataSourceIndex<T>> {
  /**
   * @return The data.
   */
  getData(): Promise<T>;
}
