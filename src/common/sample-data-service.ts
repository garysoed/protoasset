import {Arrays} from 'external/gs_tools/src/collection';
import {bind, inject} from 'external/gs_tools/src/inject';

import {RouteService} from 'external/gs_ui/src/routing';

import {AssetCollection} from '../data/asset-collection';
import {RouteFactoryService} from '../routing/route-factory-service';
import {Views} from '../routing/views';


@bind('pa.data.SampleDataService')
export class SampleDataService {
  private readonly assetCollection_: AssetCollection;
  private readonly routeFactoryService_: RouteFactoryService;
  private readonly routeService_: RouteService<Views>;

  private dataRow_: number | null;

  constructor(
      @inject('pa.data.AssetCollection') assetCollection: AssetCollection,
      @inject('pa.routing.RouteFactoryService') routeFactoryService: RouteFactoryService,
      @inject('gs.routing.RouteService') routeService: RouteService<Views>) {
    this.assetCollection_ = assetCollection;
    // TODO: Initialize to null.
    this.dataRow_ = 0;
    this.routeFactoryService_ = routeFactoryService;
    this.routeService_ = routeService;
  }

  /**
   * @return Row index of the data to use in the current array.
   */
  getDataRow(): number | null {
    return this.dataRow_;
  }

  /**
   * @return Promise that will be resolved with row data corresponding to the current array.
   */
  async getRowData(): Promise<string[] | null> {
    if (this.dataRow_ === null) {
      return null;
    }

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

    const data = await dataSource.getData();
    return data[this.dataRow_] || null;
  }

  /**
   * @param row The row index of the data in the current array to use as sample data.
   */
  setDataRow(row: number | null): void {
    this.dataRow_ = row;
  }
}
