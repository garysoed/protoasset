import { cache, Serializable } from 'external/gs_tools/src/data';
import { DataModel, DataModels, field } from 'external/gs_tools/src/datamodel';
import { ImmutableMap } from 'external/gs_tools/src/immutable';
import { StringParser } from 'external/gs_tools/src/parse';

import { DataSource } from '../data/data-source';

type SearchIndex = {this: InMemoryDataSource};

/**
 * Data source where the data is stored in memory.
 */
@Serializable('inMemoryDataSource')
export abstract class InMemoryDataSource implements DataModel<SearchIndex>, DataSource<string> {
  @field('data', StringParser) protected readonly data_: string;

  /**
   * @override
   */
  abstract getData(): Promise<string>;

  @cache()
  getSearchIndex(): SearchIndex {
    return {this: this};
  }

  static newInstance(data: string): InMemoryDataSource {
    return DataModels.newInstance<InMemoryDataSource>(
        InMemoryDataSource,
        ImmutableMap.of([['data_', data]]));
  }
}
