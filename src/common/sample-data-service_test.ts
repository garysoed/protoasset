import { assert, Matchers, TestBase } from '../test-base';
TestBase.setup();

import { Mocks } from 'external/gs_tools/src/mock';
import { TestDispose } from 'external/gs_tools/src/testing';

import { SampleDataService } from './sample-data-service';
import { SampleDataServiceEvent } from './sample-data-service-event';


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
    TestDispose.add(service);
  });

  describe('getData_', () => {
    it('should resolve with the correct data', async () => {
      const layerRouteFactory = Mocks.object('layerRouteFactory');
      mockRouteFactoryService.layer.and.returnValue(layerRouteFactory);

      const assetId = 'assetId';
      const projectId = 'projectId';
      mockRouteService.getParams.and.returnValue({assetId, projectId});

      const data = Mocks.object('data');
      const mockDataSource = jasmine.createSpyObj('DataSource', ['getData']);
      mockDataSource.getData.and.returnValue(Promise.resolve(data));

      const mockAsset = jasmine.createSpyObj('Asset', ['getData']);
      mockAsset.getData.and.returnValue(mockDataSource);
      mockAssetCollection.get.and.returnValue(Promise.resolve(mockAsset));

      assert(await service['getData_']()).to.equal(data);
      assert(mockAssetCollection.get).to.haveBeenCalledWith(projectId, assetId);
      assert(mockRouteService.getParams).to.haveBeenCalledWith(layerRouteFactory);
    });

    it('should resolve with null if there are no data source', async () => {
      const layerRouteFactory = Mocks.object('layerRouteFactory');
      mockRouteFactoryService.layer.and.returnValue(layerRouteFactory);

      const assetId = 'assetId';
      const projectId = 'projectId';
      mockRouteService.getParams.and.returnValue({assetId, projectId});

      const mockAsset = jasmine.createSpyObj('Asset', ['getData']);
      mockAsset.getData.and.returnValue(null);
      mockAssetCollection.get.and.returnValue(Promise.resolve(mockAsset));

      assert(await service['getData_']()).to.beNull();
      assert(mockAssetCollection.get).to.haveBeenCalledWith(projectId, assetId);
      assert(mockRouteService.getParams).to.haveBeenCalledWith(layerRouteFactory);
    });

    it('should resolve with null if there are no assets', async () => {
      const layerRouteFactory = Mocks.object('layerRouteFactory');
      mockRouteFactoryService.layer.and.returnValue(layerRouteFactory);

      const assetId = 'assetId';
      const projectId = 'projectId';
      mockRouteService.getParams.and.returnValue({assetId, projectId});

      mockAssetCollection.get.and.returnValue(Promise.resolve(null));

      assert(await service['getData_']()).to.beNull();
      assert(mockAssetCollection.get).to.haveBeenCalledWith(projectId, assetId);
      assert(mockRouteService.getParams).to.haveBeenCalledWith(layerRouteFactory);
    });

    it('should resolve with null if no params can be found', async () => {
      const layerRouteFactory = Mocks.object('layerRouteFactory');
      mockRouteFactoryService.layer.and.returnValue(layerRouteFactory);
      mockRouteService.getParams.and.returnValue(null);

      mockAssetCollection.get.and.returnValue(Promise.resolve(null));

      assert(await service['getData_']()).to.beNull();
      assert(mockRouteService.getParams).to.haveBeenCalledWith(layerRouteFactory);
    });
  });

  describe('getFuse', () => {
    it('should return with the correct Fuse', async () => {
      const entry00 = 'entry00';
      const entry01 = 'entry01';
      const entry10 = 'entry10';
      spyOn(service, 'getData_').and.returnValue(Promise.resolve([
        [entry00, entry01],
        [entry10],
      ]));

      const fuse = Mocks.object('fuse');
      spyOn(service, 'createFuse_').and.returnValue(fuse);

      assert(await service.getFuse()).to.equal(fuse);
      assert(service['createFuse_']).to.haveBeenCalledWith([
        {display: entry00, row: 0},
        {display: entry01, row: 0},
        {display: entry10, row: 1},
      ]);
    });

    it('should return null if there are no data', async () => {
      spyOn(service, 'getData_').and.returnValue(Promise.resolve(null));
      assert(await service.getFuse()).to.beNull();
    });
  });

  describe('getRowData', () => {
    it('should resolve with the correct data', async () => {
      const rowData = Mocks.object('rowData');
      spyOn(service, 'getData_').and
          .returnValue(Promise.resolve(['otherRowData', rowData, 'other']));

      service.setDataRow(1);
      assert(await service.getRowData()).to.equal(rowData);
    });

    it('should resolve with null if there are no data at the data row', async () => {
      const rowData = Mocks.object('rowData');
      spyOn(service, 'getData_').and
          .returnValue(Promise.resolve(['otherRowData', rowData, 'other']));

      service.setDataRow(3);
      assert(await service.getRowData()).to.beNull();
    });

    it('should resolve with null if there are no data', async () => {
      spyOn(service, 'getData_').and.returnValue(Promise.resolve(null));

      service.setDataRow(3);
      assert(await service.getRowData()).to.beNull();
    });

    it('should resolve with null if data row is null', async () => {
      service.setDataRow(null);
      assert(await service.getRowData()).to.beNull();
    });
  });

  describe('setDataRow', () => {
    it('should dispatch the ROW_CHANGED event', () => {
      const dataRow = 123;
      const dispatchSpy = spyOn(service, 'dispatch');

      service.setDataRow(dataRow);

      assert(service.dispatch).to.haveBeenCalledWith(
          SampleDataServiceEvent.ROW_CHANGED, <() => void> Matchers.any(Function));
      dispatchSpy.calls.argsFor(0)[1]();
      assert(service.getDataRow()).to.equal(dataRow);
    });

    it('should do nothing if the data row is equal to the given row', () => {
      const dataRow = 123;
      spyOn(service, 'dispatch');

      service['dataRow_'] = dataRow;
      service.setDataRow(dataRow);

      assert(service.dispatch).toNot.haveBeenCalled();
    });
  });
});
