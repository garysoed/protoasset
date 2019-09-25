import {
  DataGraph,
  DataModel,
  registerDataGraph,
  SearchIndex } from 'external/gs_tools/src/datamodel';
import { StaticId } from 'external/gs_tools/src/graph/static-id';
import { DataModelParser } from 'external/gs_tools/src/parse';
import { CachedStorage, LocalStorage } from 'external/gs_tools/src/store';

import { FuseSearcher } from '../data/fuse-searcher';

export function registerFuseBackedGraph<S extends SearchIndex<D>, D extends DataModel<any>>(
    name: string,
    window: Window): StaticId<DataGraph<D>> {
  const storage = CachedStorage.of(LocalStorage.of<D>(window, name, DataModelParser<D>()));
  return registerDataGraph(new FuseSearcher<S, D>(), storage);
}
