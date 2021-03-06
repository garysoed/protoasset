import { ImmutableList, ImmutableSet } from 'external/gs_tools/src/immutable';
import { Storage as GsStorage } from 'external/gs_tools/src/store';


export class CollectionStorage<T, I extends {this: T}> {
  private fusePromise_: Promise<Fuse<I>> | null = null;
  private readonly getSearchIndex_: (item: T) => I;
  private readonly storage_: GsStorage<T>;

  constructor(getSearchIndex: (item: T) => I, storage: GsStorage<T>) {
    this.getSearchIndex_ = getSearchIndex;
    this.storage_ = storage;
  }

  /**
   * Creates a Fuse object.
   * @param indexes Search indexes to initialize the fuse with.
   * @return New instance of Fuse.
   */
  private createFuse_(indexes: ImmutableSet<I>): Fuse<I> {
    return new Fuse<I>(
        [...indexes],
        {
          keys: ['name'],
          shouldSort: true,
          threshold: 0.5,
        });
  }

  /**
   * @return The promise that will be resolved with the requested item, or null if it does not
   *    exist.
   */
  get(itemId: string): Promise<T | null> {
    return this.storage_.read(itemId);
  }

  /**
   * Gets the promise that will be resolved with the fuse object initialized with the item
   * search indexes.
   * @return Promise that will be resolved with the fuse object.
   */
  private getFusePromise_(): Promise<Fuse<I>> {
    if (this.fusePromise_ !== null) {
      return this.fusePromise_;
    }

    this.fusePromise_ = this
        .list()
        .then((items: ImmutableSet<T>) => {
          const searchIndexes = items
              .mapItem((item: T) => {
                return this.getSearchIndex_(item);
              });
          return this.createFuse_(searchIndexes);
        });
    return this.fusePromise_;
  }

  /**
   * @return A list of items in the storage.
   */
  list(): Promise<ImmutableSet<T>> {
    return this.storage_.list();
  }

  /**
   * Reserves an ID for creating a new item.
   *
   * @return Promise that will be resolved with the item ID that is guaranteed to be unique.
   */
  reserveId(): Promise<string> {
    return this.storage_.generateId();
  }

  /**
   * Searches for items that satisfies the given token.
   * @param token The search token.
   * @return Promise that will be resolved with the items.
   */
  async search(token: string): Promise<T[]> {
    const fuse = await this.getFusePromise_();
    const results = fuse.search(token);
    const list = ImmutableList
        .of(results)
        .map((result: I) => {
          return result.this;
        });
    return [...list];
  }

  /**
   * Updates the given item.
   *
   * @param itemId ID of the item to update.
   * @param item The item to update.
   * @return Promise that will be resolved with true iff the item is new.
   */
  async update(itemId: string, item: T): Promise<boolean> {
    const existingItem = await this.storage_.read(itemId);
    const [isNewItem] = await Promise.all([
      existingItem === null,
      this.storage_.update(itemId, item),
    ]);
    this.fusePromise_ = null;
    return isNewItem;
  }

  /**
   * @param getSearchIndex Function to get the search index from the given item.
   * @param storage The underlying storage object.
   */
  static of<T, I extends {this: T}>(
      getSearchIndex: (item: T) => I,
      storage: GsStorage<T>): CollectionStorage<T, I> {
    return new CollectionStorage(getSearchIndex, storage);
  }
}
// TODO: Mutable
