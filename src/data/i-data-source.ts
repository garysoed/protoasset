/**
 * Represents a source of data.
 *
 * @param <T> Type of the data.
 */
export interface IDataSource<T> {
  /**
   * @return The data.
   */
  getData(): Promise<T>;
}
