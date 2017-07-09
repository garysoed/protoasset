import { Promises } from 'external/gs_tools/src/async';
import { Bus } from 'external/gs_tools/src/event';
import {
  ImmutableList,
  ImmutableSet,
  Iterables } from 'external/gs_tools/src/immutable';
import { MonadFactory } from 'external/gs_tools/src/interfaces';
import { Storage as GsStorage } from 'external/gs_tools/src/store';
import { Log } from 'external/gs_tools/src/util';

import { DataAccess } from '../data/data-access';
import { DataModel } from '../data/data-model';
import { SearchIndex } from '../data/search-index';

type EventType = 'add' | 'remove' | 'edit';
export type ManagerEvent<T extends DataModel<any>> = {data: T, type: EventType};

export abstract class Manager<S extends SearchIndex<D>, D extends DataModel<S>>
    extends Bus<EventType, ManagerEvent<D>> {
  private fusePromise_: Promise<Fuse<S>> | null;

  constructor(
      protected readonly storage_: GsStorage<D>,
      logger: Log) {
    super(logger);
    this.fusePromise_ = null;
  }

  /**
   * Creates a Fuse object.
   * @param indexes Search indexes to initialize the fuse with.
   * @return New instance of Fuse.
   */
  private createFuse_(indexes: ImmutableSet<S>): Fuse<S> {
    return new Fuse<S>(
        Iterables.toArray(indexes),
        {
          keys: ['name'],
          shouldSort: true,
          threshold: 0.5,
        });
  }

  private get_(id: string): Promise<D | null> {
    return this.storage_.read(id);
  }

  /**
   * Gets the promise that will be resolved with the fuse object initialized with the item
   * search indexes.
   * @return Promise that will be resolved with the fuse object.
   */
  private getFusePromise_(): Promise<Fuse<S>> {
    if (this.fusePromise_ !== null) {
      return this.fusePromise_;
    }

    this.fusePromise_ = this
        .list_()
        .then((items: ImmutableSet<D>) => {
          const searchIndexes = items
              .mapItem((item: D) => {
                return item.getSearchIndex();
              });
          return this.createFuse_(searchIndexes);
        });
    return this.fusePromise_;
  }

  idMonad(): MonadFactory<Promise<string>> {
    const id = this.storage_.generateId();
    return () => ({
      get: () => {
        return id;
      },

      set: () => {
        // Noop
      },
    });
  }

  private list_(): Promise<ImmutableSet<D>> {
    return this.storage_.list();
  }

  monad(): MonadFactory<DataAccess<D>> {
    return () => ({
      get: () => {
        return DataAccess.of<D>(
            this.get_.bind(this),
            this.list_.bind(this),
            this.search_.bind(this));
      },

      set: (dataAccess: DataAccess<D>) => {
        return Promises
            .forFiniteCollection(dataAccess
                .getUpdateQueue()
                .map((item: D, id: string) => {
                  return this.update_(id, item);
                })
                .values());
      },
    });
  }

  private async search_(this: Manager<S, D>, token: string): Promise<ImmutableList<D>> {
    const fuse = await this.getFusePromise_();
    return ImmutableList.of(fuse.search(token))
        .map((result: S) => {
          return result.this;
        });
  }

  private async update_(id: string, item: D): Promise<void> {
    const existingItem = await this.storage_.read(id);
    await this.storage_.update(id, item);

    this.dispatch({data: item, type: existingItem ? 'edit' : 'add'});

    this.fusePromise_ = null;
  }
}
