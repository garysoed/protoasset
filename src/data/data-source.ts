/**
 * Represents a source of data.
 *
 * @param <T> Type of the data.
 */
export interface DataSource<T> {
  /**
   * @return The data.
   */
  getData(): Promise<T>;
}
// TODO: Mutable
