import {assert, TestBase} from '../test-base';
TestBase.setup();

import {Mocks} from 'external/gs_tools/src/mock';
import {TestDispose} from 'external/gs_tools/src/testing';

import {InMemoryDataSource} from '../data/in-memory-data-source';
import {TsvDataSource} from '../data/tsv-data-source';

import {DataView, previewRowDataSetter, previewRowGenerator} from './data-view';


describe('previewRowDataSetter', () => {
  it('should generate additional cell elements if the are not enough elements', () => {
    let data1 = 'data1';
    let data2 = 'data2';

    let cell1 = Mocks.object('cell1');
    let cell2 = Mocks.object('cell2');
    let mockDocument = jasmine.createSpyObj('Document', ['createElement']);
    mockDocument.createElement.and.returnValues(cell1, cell2);

    let mockRoot = jasmine.createSpyObj('Root', ['appendChild']);
    mockRoot.ownerDocument = mockDocument;
    mockRoot.childElementCount = 0;

    previewRowDataSetter([data1, data2], mockRoot);

    assert(cell1.textContent).to.equal(data1);
    assert(cell2.textContent).to.equal(data2);
    assert(mockRoot.appendChild).to.haveBeenCalledWith(cell1);
    assert(mockRoot.appendChild).to.haveBeenCalledWith(cell2);
    assert(mockDocument.createElement).to.haveBeenCalledWith('td');
  });

  it('should reuse existing cell elements if there are enough elements', () => {
    let data1 = 'data1';
    let data2 = 'data2';

    let cell1 = Mocks.object('cell1');
    let cell2 = Mocks.object('cell2');

    let mockRoot = jasmine.createSpyObj('Root', ['appendChild']);
    mockRoot.childElementCount = 2;

    let mockChildrenList = jasmine.createSpyObj('ChildrenList', ['item']);
    mockChildrenList.item.and.callFake((index: number) => {
      switch (index) {
        case 0:
          return cell1;
        case 1:
          return cell2;
      }
    });
    mockRoot.children = mockChildrenList;

    previewRowDataSetter([data1, data2], mockRoot);

    assert(cell1.textContent).to.equal(data1);
    assert(cell2.textContent).to.equal(data2);
    assert(mockRoot.appendChild).toNot.haveBeenCalled();
    assert(mockChildrenList.item).to.haveBeenCalledWith(0);
    assert(mockChildrenList.item).to.haveBeenCalledWith(1);
  });
});

describe('previewRowGenerator', () => {
  it('should return the correct element', () => {
    let element = Mocks.object('element');
    let mockDocument = jasmine.createSpyObj('Document', ['createElement']);
    mockDocument.createElement.and.returnValue(element);
    assert(previewRowGenerator(mockDocument)).to.equal(element);
    assert(mockDocument.createElement).to.haveBeenCalledWith('tr');
  });
});

describe('asset.DataView', () => {
  let mockAssetCollection;
  let mockFileService;
  let mockRouteFactoryService;
  let mockRouteService;
  let view: DataView;

  beforeEach(() => {
    mockAssetCollection = jasmine.createSpyObj('AssetCollection', ['get', 'update']);
    mockFileService = jasmine.createSpyObj('FileService', ['processBundle']);
    mockRouteFactoryService = jasmine.createSpyObj('RouteFactoryService', ['assetData']);
    mockRouteService = jasmine.createSpyObj('RouteService', ['getParams']);

    view = new DataView(
        mockAssetCollection,
        mockFileService,
        mockRouteFactoryService,
        mockRouteService,
        Mocks.object('ThemeService'));
    TestDispose.add(view);
  });

  describe('getAsset_', () => {
    it('should return the asset', async (done: any) => {
      let assetId = 'assetId';
      let projectId = 'projectId';
      mockRouteService.getParams.and.returnValue({assetId, projectId});

      let assetDataFactory = Mocks.object('assetDataFactory');
      mockRouteFactoryService.assetData.and.returnValue(assetDataFactory);

      let asset = Mocks.object('asset');
      mockAssetCollection.get.and.returnValue(Promise.resolve(asset));

      let actualAsset = await view['getAsset_']();
      assert(actualAsset).to.equal(asset);
      assert(mockAssetCollection.get).to.haveBeenCalledWith(projectId, assetId);
      assert(mockRouteService.getParams).to.haveBeenCalledWith(assetDataFactory);
    });

    it('should return null if route params cannot be resolved', async (done: any) => {
      mockRouteService.getParams.and.returnValue(null);
      mockRouteFactoryService.assetData.and.returnValue(Mocks.object('assetDataFactory'));

      let actualAsset = await view['getAsset_']();
      assert(actualAsset).to.beNull();
    });
  });

  describe('onGsViewActiveAttrChange_', () => {
    it('should update the preview if the value is true', () => {
      spyOn(view, 'updatePreview_');
      view['onGsViewActiveAttrChange_'](true);
      assert(view['updatePreview_']).to.haveBeenCalledWith();
    });

    it('should not update the preview if the value is false', () => {
      spyOn(view, 'updatePreview_');
      view['onGsViewActiveAttrChange_'](false);
      assert(view['updatePreview_']).toNot.haveBeenCalled();
    });
  });

  describe('updateAsset_', () => {
    it('should update the asset correctly with the given data source', async (done: any) => {
      let dataSource = Mocks.object('dataSource');
      let projectId = 'projectId';
      let mockAsset = jasmine.createSpyObj('Asset', ['getProjectId', 'setData']);
      mockAsset.getProjectId.and.returnValue(projectId);
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));
      await view['updateAsset_'](dataSource);
      assert(mockAssetCollection.update).to.haveBeenCalledWith(mockAsset);
      assert(mockAsset.setData).to.haveBeenCalledWith(dataSource);
    });

    it('should not reject if asset cannot be found', async (done: any) => {
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(null));
      await view['updateAsset_'](Mocks.object('dataSource'));
    });
  });

  describe('updateDataSource_', () => {
    it('should update the asset and preview correctly', async (done: any) => {
      let bundleId = 'bundleId';
      spyOn(view['dataSourceBundleIdBridge_'], 'get').and.returnValue(bundleId);

      let startRow = 123;
      spyOn(view['startRowValueBridge_'], 'get').and.returnValue(startRow);

      let endRow = 456;
      spyOn(view['endRowValueBridge_'], 'get').and.returnValue(endRow);

      let content = 'content';
      mockFileService.processBundle.and
          .returnValue(Promise.resolve(new Map([[Mocks.object('File'), content]])));

      let inMemoryDataSource = Mocks.object('inMemoryDataSource');
      spyOn(InMemoryDataSource, 'of').and.returnValue(inMemoryDataSource);

      let dataSource = Mocks.object('dataSource');
      spyOn(TsvDataSource, 'of').and.returnValue(dataSource);

      spyOn(view, 'updateAsset_').and.returnValue(Promise.resolve());
      spyOn(view, 'updatePreview_').and.returnValue(Promise.resolve());

      await view['updateDataSource_']();
      assert(view['updateAsset_']).to.haveBeenCalledWith(dataSource);
      assert(view['updatePreview_']).to.haveBeenCalledWith();
      assert(TsvDataSource.of).to.haveBeenCalledWith(inMemoryDataSource, startRow, endRow);
      assert(InMemoryDataSource.of).to.haveBeenCalledWith(content);
      assert(mockFileService.processBundle).to.haveBeenCalledWith(bundleId);
    });

    it('should not update the asset, but still update the preview, if there are no files in the '
        + 'bundle',
        async (done: any) => {
          let bundleId = 'bundleId';
          spyOn(view['dataSourceBundleIdBridge_'], 'get').and.returnValue(bundleId);

          let startRow = 123;
          spyOn(view['startRowValueBridge_'], 'get').and.returnValue(startRow);

          let endRow = 456;
          spyOn(view['endRowValueBridge_'], 'get').and.returnValue(endRow);

          mockFileService.processBundle.and.returnValue(Promise.resolve(new Map()));

          let inMemoryDataSource = Mocks.object('inMemoryDataSource');
          spyOn(InMemoryDataSource, 'of').and.returnValue(inMemoryDataSource);

          let dataSource = Mocks.object('dataSource');
          spyOn(TsvDataSource, 'of').and.returnValue(dataSource);

          spyOn(view, 'updateAsset_').and.returnValue(Promise.resolve());
          spyOn(view, 'updatePreview_').and.returnValue(Promise.resolve());

          await view['updateDataSource_']();
          assert(view['updateAsset_']).toNot.haveBeenCalled();
          assert(view['updatePreview_']).to.haveBeenCalledWith();
        });

    it('should not update the asset, but still update the preview, if the bundle cannot be '
        + 'processed',
        async (done: any) => {
          let bundleId = 'bundleId';
          spyOn(view['dataSourceBundleIdBridge_'], 'get').and.returnValue(bundleId);
          spyOn(view['startRowValueBridge_'], 'get').and.returnValue(123);
          spyOn(view['endRowValueBridge_'], 'get').and.returnValue(456);

          mockFileService.processBundle.and.returnValue(Promise.resolve(null));

          let inMemoryDataSource = Mocks.object('inMemoryDataSource');
          spyOn(InMemoryDataSource, 'of').and.returnValue(inMemoryDataSource);

          let dataSource = Mocks.object('dataSource');
          spyOn(TsvDataSource, 'of').and.returnValue(dataSource);
          spyOn(view, 'updateAsset_');
          spyOn(view, 'updatePreview_');

          await view['updateDataSource_']();
          assert(view['updateAsset_']).toNot.haveBeenCalled();
          assert(view['updatePreview_']).to.haveBeenCalledWith();
        });

    it('should do nothing if the start row is NaN', async (done: any) => {
      spyOn(view['dataSourceBundleIdBridge_'], 'get').and.returnValue('bundleId');
      spyOn(view['startRowValueBridge_'], 'get').and.returnValue(NaN);
      spyOn(view['endRowValueBridge_'], 'get').and.returnValue(456);
      spyOn(view, 'updateAsset_');
      spyOn(view, 'updatePreview_');

      await view['updateDataSource_']();
      assert(view['updateAsset_']).toNot.haveBeenCalled();
      assert(view['updatePreview_']).toNot.haveBeenCalled();
    });

    it('should do nothing if the start row is null', async (done: any) => {
      spyOn(view['dataSourceBundleIdBridge_'], 'get').and.returnValue('bundleId');
      spyOn(view['startRowValueBridge_'], 'get').and.returnValue(null);
      spyOn(view['endRowValueBridge_'], 'get').and.returnValue(456);
      spyOn(view, 'updateAsset_');
      spyOn(view, 'updatePreview_');

      await view['updateDataSource_']();
      assert(view['updateAsset_']).toNot.haveBeenCalled();
      assert(view['updatePreview_']).toNot.haveBeenCalled();
    });

    it('should do nothing if the end row is NaN', async (done: any) => {
      spyOn(view['dataSourceBundleIdBridge_'], 'get').and.returnValue('bundleId');
      spyOn(view['startRowValueBridge_'], 'get').and.returnValue(123);
      spyOn(view['endRowValueBridge_'], 'get').and.returnValue(NaN);
      spyOn(view, 'updateAsset_');
      spyOn(view, 'updatePreview_');

      await view['updateDataSource_']();
      assert(view['updateAsset_']).toNot.haveBeenCalled();
      assert(view['updatePreview_']).toNot.haveBeenCalled();
    });

    it('should do nothing if the end row is null', async (done: any) => {
      spyOn(view['dataSourceBundleIdBridge_'], 'get').and.returnValue('bundleId');
      spyOn(view['startRowValueBridge_'], 'get').and.returnValue(123);
      spyOn(view['endRowValueBridge_'], 'get').and.returnValue(null);
      spyOn(view, 'updateAsset_');
      spyOn(view, 'updatePreview_');

      await view['updateDataSource_']();
      assert(view['updateAsset_']).toNot.haveBeenCalled();
      assert(view['updatePreview_']).toNot.haveBeenCalled();
    });

    it('should do nothing if the bundle ID cannot be found', async (done: any) => {
      spyOn(view['dataSourceBundleIdBridge_'], 'get').and.returnValue(null);
      spyOn(view['startRowValueBridge_'], 'get').and.returnValue(123);
      spyOn(view['endRowValueBridge_'], 'get').and.returnValue(456);
      spyOn(view, 'updateAsset_');
      spyOn(view, 'updatePreview_');

      await view['updateDataSource_']();
      assert(view['updateAsset_']).toNot.haveBeenCalled();
      assert(view['updatePreview_']).toNot.haveBeenCalled();
    });
  });

  describe('updatePreview_', () => {
    it('should update the preview correctly', async (done: any) => {
      let data = Mocks.object('data');
      let mockDataSource = jasmine.createSpyObj('DataSource', ['getData']);
      mockDataSource.getData.and.returnValue(data);

      let mockAsset = jasmine.createSpyObj('Asset', ['getData']);
      mockAsset.getData.and.returnValue(mockDataSource);

      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));
      spyOn(view['previewChildrenBridge_'], 'delete');
      spyOn(view['previewChildrenBridge_'], 'set');

      await view['updatePreview_']();
      assert(view['previewChildrenBridge_'].delete).to.haveBeenCalledWith();
      assert(view['previewChildrenBridge_'].set).to.haveBeenCalledWith(data);
    });

    it('should clear the preview if the data cannot be loaded', async (done: any) => {
      let mockDataSource = jasmine.createSpyObj('DataSource', ['getData']);
      mockDataSource.getData.and.returnValue(null);

      let mockAsset = jasmine.createSpyObj('Asset', ['getData']);
      mockAsset.getData.and.returnValue(mockDataSource);

      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));
      spyOn(view['previewChildrenBridge_'], 'delete');
      spyOn(view['previewChildrenBridge_'], 'set');

      await view['updatePreview_']();
      assert(view['previewChildrenBridge_'].delete).to.haveBeenCalledWith();
      assert(view['previewChildrenBridge_'].set).toNot.haveBeenCalled();
    });

    it('should clear the preview if the asset has no data source', async (done: any) => {
      let mockAsset = jasmine.createSpyObj('Asset', ['getData']);
      mockAsset.getData.and.returnValue(null);

      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));
      spyOn(view['previewChildrenBridge_'], 'delete');
      spyOn(view['previewChildrenBridge_'], 'set');

      await view['updatePreview_']();
      assert(view['previewChildrenBridge_'].delete).to.haveBeenCalledWith();
      assert(view['previewChildrenBridge_'].set).toNot.haveBeenCalled();
    });

    it('should clear the preview if asset cannot be found', async (done: any) => {
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(null));
      spyOn(view['previewChildrenBridge_'], 'delete');
      spyOn(view['previewChildrenBridge_'], 'set');

      await view['updatePreview_']();
      assert(view['previewChildrenBridge_'].delete).to.haveBeenCalledWith();
      assert(view['previewChildrenBridge_'].set).toNot.haveBeenCalled();
    });
  });
}); ;
