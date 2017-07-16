import { DataModel, Manager } from 'external/gs_tools/src/datamodel';
import { SearchIndex } from 'external/gs_tools/src/datamodel/search-index';
import { DataModelParser } from 'external/gs_tools/src/parse';
import { CachedStorage, LocalStorage } from 'external/gs_tools/src/store';
import { Log } from 'external/gs_tools/src/util';

import { FuseSearcher } from '../data/fuse-searcher';

export class FuseBackedManager<
    S extends SearchIndex<D>, D extends DataModel<any>> extends Manager<D> {
  constructor(prefix: string, log: Log, window: Window) {
    const storage = CachedStorage.of(
        LocalStorage.of<D>(window, prefix, DataModelParser<D>()));
    super(storage, new FuseSearcher<S, D>(), log);
    this.addDisposable(storage);
  }
}
