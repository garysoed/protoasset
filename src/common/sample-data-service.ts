import { BaseListenable } from 'external/gs_tools/src/event';
import { ImmutableList } from 'external/gs_tools/src/immutable';
import { bind, inject } from 'external/gs_tools/src/inject';

import { Route, RouteService } from 'external/gs_ui/src/routing';

import { SampleDataServiceEvent } from '../common/sample-data-service-event';
import { AssetCollection } from '../data/asset-collection';
import { RouteFactoryService } from '../routing/route-factory-service';
import { Views } from '../routing/views';


export type SampleDataSearchIndex = {
  item: {
    display: string,
    row: number,
  },
  matches: {
    indices: number[],
  },
};


@bind('pa.common.SampleDataService')
export class SampleDataService extends BaseListenable<SampleDataServiceEvent> {
  private readonly assetCollection_: AssetCollection;
  private dataRow_: number | null;
  private readonly routeFactoryService_: RouteFactoryService;
  private readonly routeService_: RouteService<Views>;

  constructor(
      @inject('pa.data.AssetCollection') assetCollection: AssetCollection,
      @inject('pa.routing.RouteFactoryService') routeFactoryService: RouteFactoryService,
      @inject('gs.routing.RouteService') routeService: RouteService<Views>) {
    super();
    this.assetCollection_ = assetCollection;
    this.dataRow_ = 0;
    this.routeFactoryService_ = routeFactoryService;
    this.routeService_ = routeService;
  }

  /**
   * Creates a new Fuse object with the given data.
   * @param data Data to populate the Fuse object with.
   */
  private createFuse_(data: {display: string, row: number}[]): Fuse<SampleDataSearchIndex> {
    return new Fuse<SampleDataSearchIndex>(
        data,
        {include: ['matches'], keys: ['display'], shouldSort: true, threshold: 0.5});
  }

  async getData_(): Promise<string[][] | null> {
    const navigator = this.routeService_.monad().get();
    const routes = ImmutableList
        .of([
          navigator.getRoute(this.routeFactoryService_.layer()),
          navigator.getRoute(this.routeFactoryService_.helper()),
        ])
        .find((route: Route<Views, any> | null) => {
          return route !== null;
        })!;

    if (routes === null) {
      return null;
    }

    const {params} = routes;
    const asset = await this.assetCollection_.get(params.projectId, params.assetId);
    if (asset === null) {
      return null;
    }

    const dataSource = asset.getData();
    if (dataSource === null) {
      return null;
    }

    return await dataSource.getData();
  }

  /**
   * @return Row index of the data to use in the current array.
   */
  getDataRow(): number | null {
    return this.dataRow_;
  }

  /**
   * @return Promise that will be resolved with the Fuse object populated with all the data in the
   *    current asset.
   */
  async getFuse(): Promise<Fuse<SampleDataSearchIndex> | null> {
    const data = await this.getData_();
    if (data === null) {
      return null;
    }

    const indexes: {display: string, row: number}[] = [];
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      for (let j = 0; j < row.length; j++) {
        indexes.push({
          display: row[j],
          row: i,
        });
      }
    }

    return this.createFuse_(indexes);
  }

  /**
   * @return Promise that will be resolved with row data corresponding to the current array.
   */
  async getRowData(): Promise<string[] | null> {
    if (this.dataRow_ === null) {
      return null;
    }

    const data = await this.getData_();
    if (data === null) {
      return null;
    }

    return data[this.dataRow_] || null;
  }

  /**
   * @param row The row index of the data in the current array to use as sample data.
   */
  setDataRow(row: number | null): void {
    if (this.dataRow_ === row) {
      return;
    }

    this.dispatch(SampleDataServiceEvent.ROW_CHANGED, () => {
      this.dataRow_ = row;
    });
  }
}
// TODO: Mutable
