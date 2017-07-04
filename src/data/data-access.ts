import { ImmutableList, ImmutableMap } from 'external/gs_tools/src/immutable';

type Getter<T> = (id: string) => Promise<T | null>;
type Searcher<T> = (token: string) => Promise<ImmutableList<T>>;

export class DataAccess<D> {
  constructor(
      private readonly getter_: Getter<D>,
      private readonly searcher_: Searcher<D>,
      private readonly updateQueue_: ImmutableMap<string, D>) { }

  get(id: string): Promise<D | null> {
    return this.getter_(id);
  }

  getUpdateQueue(): ImmutableMap<string, D> {
    return this.updateQueue_;
  }

  queueUpdate(id: string, data: D): DataAccess<D> {
    return new DataAccess<D>(this.getter_, this.searcher_, this.updateQueue_.set(id, data));
  }

  search(token: string): Promise<ImmutableList<D>> {
    return this.searcher_(token);
  }

  static of<D>(getter: Getter<D>, searcher: Searcher<D>): DataAccess<D> {
    return new DataAccess(getter, searcher, ImmutableMap.of<string, D>([]));
  }
}
