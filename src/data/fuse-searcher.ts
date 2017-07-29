import { DataModel, Searcher } from 'external/gs_tools/src/datamodel';
import { SearchIndex } from 'external/gs_tools/src/datamodel/search-index';
import { ImmutableList, ImmutableSet } from 'external/gs_tools/src/immutable';

export class FuseSearcher<S extends SearchIndex<T>, T extends DataModel<S>> implements Searcher<T> {
  private fusePromise_: Promise<Fuse<S>> | null;

  /**
   * Creates a Fuse object.
   * @param indexes Search indexes to initialize the fuse with.
   * @return New instance of Fuse.
   */
  private createFuse_(indexes: ImmutableSet<S>): Fuse<S> {
    return new Fuse<S>(
        [...indexes],
        {
          keys: ['name'],
          shouldSort: true,
          threshold: 0.5,
        });
  }

  index(data: Promise<ImmutableSet<T>>): void {
    this.fusePromise_ = data.then((items: ImmutableSet<T>) => {
      const searchIndexes = items
          .mapItem((item: T) => {
            return item.getSearchIndex();
          });
      return this.createFuse_(searchIndexes);
    });
  }

  async search(token: string): Promise<ImmutableList<T>> {
    const fusePromise = this.fusePromise_;
    if (!fusePromise) {
      return Promise.resolve(ImmutableList.of([]));
    }

    const fuse = await fusePromise;
    return ImmutableList.of(fuse.search(token))
        .map((searchIndex: S) => {
          return searchIndex.this;
        });
  }
}
