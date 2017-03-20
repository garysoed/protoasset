import { Arrays } from 'external/gs_tools/src/collection';
import { BaseListenable } from 'external/gs_tools/src/event';
import { bind, inject } from 'external/gs_tools/src/inject';

import { RouteService } from 'external/gs_ui/src/routing';

import { AssetCollection } from '../data/asset-collection';
import { RouteFactoryService } from '../routing/route-factory-service';
import { Views } from '../routing/views';

import { SampleDataServiceEvent } from './sample-data-service-event';


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
  private readonly routeFactoryService_: RouteFactoryService;
  private readonly routeService_: RouteService<Views>;

  private dataRow_: number | null;

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
    const params = Arrays
        .of([
          this.routeService_.getParams(this.routeFactoryService_.layer()),
          this.routeService_.getParams(this.routeFactoryService_.helper()),
        ])
        .find((params: {assetId: string, projectId: string} | null) => {
          return params !== null;
        })!;

    if (params === null) {
      return null;
    }

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
    Arrays
        .of(data)
        .forEach((row: string[], index: number) => {
          Arrays
              .of(row)
              .forEach((entry: string) => {
                indexes.push({
                  display: entry,
                  row: index,
                });
              });
        });

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
