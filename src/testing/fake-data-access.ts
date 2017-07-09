import { ImmutableList, ImmutableMap } from 'external/gs_tools/src/immutable';

import { DataAccess } from '../data/data-access';

export class FakeDataAccess<T> extends DataAccess<T> {
  constructor(
      data: ImmutableMap<string, T> = ImmutableMap.of<string, T>([]),
      searchIndex: ImmutableMap<string, ImmutableList<T>> =
          ImmutableMap.of<string, ImmutableList<T>>([])) {
    super(
      (id: string) => Promise.resolve(data.get(id) || null),
      () => Promise.resolve(data.values()),
      (token: string) => Promise.resolve(searchIndex.get(token) || ImmutableList.of([])),
      ImmutableMap.of<string, T>([]));
  }
}
