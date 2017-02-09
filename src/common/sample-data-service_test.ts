import {assert, TestBase} from '../test-base';
TestBase.setup();

import {Mocks} from 'external/gs_tools/src/mock';

import {SampleDataService} from './sample-data-service';


describe('common.SampleDataService', () => {
  let mockAssetCollection;
  let mockRouteFactoryService;
  let mockRouteService;
  let service: SampleDataService;

  beforeEach(() => {
    mockAssetCollection = jasmine.createSpyObj('AssetCollection', ['get']);
    mockRouteFactoryService = jasmine.createSpyObj('RouteFactoryService', ['helper', 'layer']);
    mockRouteService = jasmine.createSpyObj('RouteService', ['getParams']);
    service = new SampleDataService(
        mockAssetCollection,
        mockRouteFactoryService,
        mockRouteService);
  });

  describe('getRowData', () => {
    it('should resolve with the correct data', async (done: any) => {
      const layerRouteFactory = Mocks.object('layerRouteFactory');
      mockRouteFactoryService.layer.and.returnValue(layerRouteFactory);

      const assetId = 'assetId';
      const projectId = 'projectId';
      mockRouteService.getParams.and.returnValue({assetId, projectId});

      const rowData = Mocks.object('rowData');
      const mockDataSource = jasmine.createSpyObj('DataSource', ['getData']);
      mockDataSource.getData.and.returnValue(Promise.resolve(['otherRowData', rowData, 'other']));

      const mockAsset = jasmine.createSpyObj('Asset', ['getData']);
      mockAsset.getData.and.returnValue(mockDataSource);
      mockAssetCollection.get.and.returnValue(Promise.resolve(mockAsset));

      service.setDataRow(1);
      assert(await service.getRowData()).to.equal(rowData);
      assert(mockAssetCollection.get).to.haveBeenCalledWith(projectId, assetId);
      assert(mockRouteService.getParams).to.haveBeenCalledWith(layerRouteFactory);
    });

    it('should resolve with null if the row data index is invalid', async (done: any) => {
      mockRouteFactoryService.layer.and.returnValue(Mocks.object('layerRouteFactory'));

      const assetId = 'assetId';
      const projectId = 'projectId';
      mockRouteService.getParams.and.returnValue({assetId, projectId});

      const mockDataSource = jasmine.createSpyObj('DataSource', ['getData']);
      mockDataSource.getData.and.returnValue(Promise.resolve(['rowData']));

      const mockAsset = jasmine.createSpyObj('Asset', ['getData']);
      mockAsset.getData.and.returnValue(mockDataSource);
      mockAssetCollection.get.and.returnValue(Promise.resolve(mockAsset));

      service.setDataRow(5);
      assert(await service.getRowData()).to.beNull();
    });

    it('should resolve with null if there is no data source in the array', async (done: any) => {
      mockRouteFactoryService.layer.and.returnValue(Mocks.object('layerRouteFactory'));

      const assetId = 'assetId';
      const projectId = 'projectId';
      mockRouteService.getParams.and.returnValue({assetId, projectId});

      const mockAsset = jasmine.createSpyObj('Asset', ['getData']);
      mockAsset.getData.and.returnValue(null);
      mockAssetCollection.get.and.returnValue(Promise.resolve(mockAsset));

      service.setDataRow(5);
      assert(await service.getRowData()).to.beNull();
    });

    it('should resolve with null if asset cannot be found', async (done: any) => {
      mockRouteFactoryService.layer.and.returnValue(Mocks.object('layerRouteFactory'));

      const assetId = 'assetId';
      const projectId = 'projectId';
      mockRouteService.getParams.and.returnValue({assetId, projectId});

      mockAssetCollection.get.and.returnValue(Promise.resolve(null));

      service.setDataRow(5);
      assert(await service.getRowData()).to.beNull();
    });

    it('should resolve with null if no params can be found', async (done: any) => {
      mockRouteFactoryService.layer.and.returnValue(Mocks.object('layerRouteFactory'));

      mockRouteService.getParams.and.returnValue(null);

      service.setDataRow(5);
      assert(await service.getRowData()).to.beNull();
    });

    it('should resolve with null if the data row index is null', async (done: any) => {
      mockRouteService.getParams.and.returnValue(null);

      service.setDataRow(null);
      assert(await service.getRowData()).to.beNull();
    });
  });
});
