import { assert, TestBase } from '../test-base';
TestBase.setup();

import { Fakes, Mocks } from 'external/gs_tools/src/mock';
import { TestDispose } from 'external/gs_tools/src/testing';

import { InMemoryDataSource } from '../data/in-memory-data-source';
import { TsvDataSource } from '../data/tsv-data-source';

import { DataView, PREVIEW_ROW_DATA_HELPER } from './data-view';


describe('PREVIEW_ROW_DATA_HELPER', () => {
  describe('create', () => {
    it('should return the correct element', () => {
      const element = Mocks.object('element');
      const mockDocument = jasmine.createSpyObj('Document', ['createElement']);
      mockDocument.createElement.and.returnValue(element);
      assert(PREVIEW_ROW_DATA_HELPER.create(mockDocument, Mocks.object('instance')))
          .to.equal(element);
      assert(mockDocument.createElement).to.haveBeenCalledWith('tr');
    });
  });

  describe('get', () => {
    it('should return the correct texts', () => {
      const text1 = 'text1';
      const text2 = 'text2';
      const element = Mocks.object('element');
      element.children = Mocks.itemList([
        {textContent: text1},
        {textContent: text2},
      ]);
      assert(PREVIEW_ROW_DATA_HELPER.get(element)).to.equal([text1, text2]);
    });

    it('should return null if one of the values is null', () => {
      const text = 'text';
      const element = Mocks.object('element');
      element.children = Mocks.itemList([
        {textContent: text},
        {textContent: null},
      ]);
      assert(PREVIEW_ROW_DATA_HELPER.get(element)).to.beNull();
    });
  });

  describe('set', () => {
    it('should generate additional cell elements if the are not enough elements', () => {
      const data1 = 'data1';
      const data2 = 'data2';

      const cell1 = Mocks.object('cell1');
      const cell2 = Mocks.object('cell2');
      const mockDocument = jasmine.createSpyObj('Document', ['createElement']);
      mockDocument.createElement.and.returnValues(cell1, cell2);

      const mockRoot = jasmine.createSpyObj('Root', ['appendChild']);
      mockRoot.ownerDocument = mockDocument;
      mockRoot.childElementCount = 0;

      PREVIEW_ROW_DATA_HELPER.set([data1, data2], mockRoot, Mocks.object('instance'));

      assert(cell1.textContent).to.equal(data1);
      assert(cell2.textContent).to.equal(data2);
      assert(mockRoot.appendChild).to.haveBeenCalledWith(cell1);
      assert(mockRoot.appendChild).to.haveBeenCalledWith(cell2);
      assert(mockDocument.createElement).to.haveBeenCalledWith('td');
    });

    it('should reuse existing cell elements if there are enough elements', () => {
      const data1 = 'data1';
      const data2 = 'data2';

      const cell1 = Mocks.object('cell1');
      const cell2 = Mocks.object('cell2');

      const mockRoot = jasmine.createSpyObj('Root', ['appendChild']);
      mockRoot.childElementCount = 2;

      const mockChildrenList = jasmine.createSpyObj('ChildrenList', ['item']);
      Fakes.build(mockChildrenList.item)
          .when(0).return(cell1)
          .when(1).return(cell2);
      mockRoot.children = mockChildrenList;

      PREVIEW_ROW_DATA_HELPER.set([data1, data2], mockRoot, Mocks.object('instance'));

      assert(cell1.textContent).to.equal(data1);
      assert(cell2.textContent).to.equal(data2);
      assert(mockRoot.appendChild).toNot.haveBeenCalled();
      assert(mockChildrenList.item).to.haveBeenCalledWith(0);
      assert(mockChildrenList.item).to.haveBeenCalledWith(1);
    });
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
    it('should return the asset', async () => {
      const assetId = 'assetId';
      const projectId = 'projectId';
      mockRouteService.getParams.and.returnValue({assetId, projectId});

      const assetDataFactory = Mocks.object('assetDataFactory');
      mockRouteFactoryService.assetData.and.returnValue(assetDataFactory);

      const asset = Mocks.object('asset');
      mockAssetCollection.get.and.returnValue(Promise.resolve(asset));

      const actualAsset = await view['getAsset_']();
      assert(actualAsset).to.equal(asset);
      assert(mockAssetCollection.get).to.haveBeenCalledWith(projectId, assetId);
      assert(mockRouteService.getParams).to.haveBeenCalledWith(assetDataFactory);
    });

    it('should return null if route params cannot be resolved', async () => {
      mockRouteService.getParams.and.returnValue(null);
      mockRouteFactoryService.assetData.and.returnValue(Mocks.object('assetDataFactory'));

      const actualAsset = await view['getAsset_']();
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
    it('should update the asset correctly with the given data source', async () => {
      const dataSource = Mocks.object('dataSource');
      const projectId = 'projectId';
      const mockAsset = jasmine.createSpyObj('Asset', ['getProjectId', 'setData']);
      mockAsset.getProjectId.and.returnValue(projectId);
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));
      await view['updateAsset_'](dataSource);
      assert(mockAssetCollection.update).to.haveBeenCalledWith(mockAsset);
      assert(mockAsset.setData).to.haveBeenCalledWith(dataSource);
    });

    it('should not reject if asset cannot be found', async () => {
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(null));
      await view['updateAsset_'](Mocks.object('dataSource'));
    });
  });

  describe('updateDataSource_', () => {
    it('should update the asset and preview correctly', async () => {
      const bundleId = 'bundleId';
      spyOn(view['dataSourceBundleIdHook_'], 'get').and.returnValue(bundleId);

      const startRow = 123;
      spyOn(view['startRowValueHook_'], 'get').and.returnValue(startRow);

      const endRow = 456;
      spyOn(view['endRowValueHook_'], 'get').and.returnValue(endRow);

      const content = 'content';
      mockFileService.processBundle.and
          .returnValue(Promise.resolve(new Map([[Mocks.object('File'), content]])));

      const inMemoryDataSource = Mocks.object('inMemoryDataSource');
      spyOn(InMemoryDataSource, 'of').and.returnValue(inMemoryDataSource);

      const dataSource = Mocks.object('dataSource');
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
        async () => {
          const bundleId = 'bundleId';
          spyOn(view['dataSourceBundleIdHook_'], 'get').and.returnValue(bundleId);

          const startRow = 123;
          spyOn(view['startRowValueHook_'], 'get').and.returnValue(startRow);

          const endRow = 456;
          spyOn(view['endRowValueHook_'], 'get').and.returnValue(endRow);

          mockFileService.processBundle.and.returnValue(Promise.resolve(new Map()));

          const inMemoryDataSource = Mocks.object('inMemoryDataSource');
          spyOn(InMemoryDataSource, 'of').and.returnValue(inMemoryDataSource);

          const dataSource = Mocks.object('dataSource');
          spyOn(TsvDataSource, 'of').and.returnValue(dataSource);

          spyOn(view, 'updateAsset_').and.returnValue(Promise.resolve());
          spyOn(view, 'updatePreview_').and.returnValue(Promise.resolve());

          await view['updateDataSource_']();
          assert(view['updateAsset_']).toNot.haveBeenCalled();
          assert(view['updatePreview_']).to.haveBeenCalledWith();
        });

    it('should not update the asset, but still update the preview, if the bundle cannot be '
        + 'processed',
        async () => {
          const bundleId = 'bundleId';
          spyOn(view['dataSourceBundleIdHook_'], 'get').and.returnValue(bundleId);
          spyOn(view['startRowValueHook_'], 'get').and.returnValue(123);
          spyOn(view['endRowValueHook_'], 'get').and.returnValue(456);

          mockFileService.processBundle.and.returnValue(Promise.resolve(null));

          const inMemoryDataSource = Mocks.object('inMemoryDataSource');
          spyOn(InMemoryDataSource, 'of').and.returnValue(inMemoryDataSource);

          const dataSource = Mocks.object('dataSource');
          spyOn(TsvDataSource, 'of').and.returnValue(dataSource);
          spyOn(view, 'updateAsset_');
          spyOn(view, 'updatePreview_');

          await view['updateDataSource_']();
          assert(view['updateAsset_']).toNot.haveBeenCalled();
          assert(view['updatePreview_']).to.haveBeenCalledWith();
        });

    it('should do nothing if the start row is NaN', async () => {
      spyOn(view['dataSourceBundleIdHook_'], 'get').and.returnValue('bundleId');
      spyOn(view['startRowValueHook_'], 'get').and.returnValue(NaN);
      spyOn(view['endRowValueHook_'], 'get').and.returnValue(456);
      spyOn(view, 'updateAsset_');
      spyOn(view, 'updatePreview_');

      await view['updateDataSource_']();
      assert(view['updateAsset_']).toNot.haveBeenCalled();
      assert(view['updatePreview_']).toNot.haveBeenCalled();
    });

    it('should do nothing if the start row is null', async () => {
      spyOn(view['dataSourceBundleIdHook_'], 'get').and.returnValue('bundleId');
      spyOn(view['startRowValueHook_'], 'get').and.returnValue(null);
      spyOn(view['endRowValueHook_'], 'get').and.returnValue(456);
      spyOn(view, 'updateAsset_');
      spyOn(view, 'updatePreview_');

      await view['updateDataSource_']();
      assert(view['updateAsset_']).toNot.haveBeenCalled();
      assert(view['updatePreview_']).toNot.haveBeenCalled();
    });

    it('should do nothing if the end row is NaN', async () => {
      spyOn(view['dataSourceBundleIdHook_'], 'get').and.returnValue('bundleId');
      spyOn(view['startRowValueHook_'], 'get').and.returnValue(123);
      spyOn(view['endRowValueHook_'], 'get').and.returnValue(NaN);
      spyOn(view, 'updateAsset_');
      spyOn(view, 'updatePreview_');

      await view['updateDataSource_']();
      assert(view['updateAsset_']).toNot.haveBeenCalled();
      assert(view['updatePreview_']).toNot.haveBeenCalled();
    });

    it('should do nothing if the end row is null', async () => {
      spyOn(view['dataSourceBundleIdHook_'], 'get').and.returnValue('bundleId');
      spyOn(view['startRowValueHook_'], 'get').and.returnValue(123);
      spyOn(view['endRowValueHook_'], 'get').and.returnValue(null);
      spyOn(view, 'updateAsset_');
      spyOn(view, 'updatePreview_');

      await view['updateDataSource_']();
      assert(view['updateAsset_']).toNot.haveBeenCalled();
      assert(view['updatePreview_']).toNot.haveBeenCalled();
    });

    it('should do nothing if the bundle ID cannot be found', async () => {
      spyOn(view['dataSourceBundleIdHook_'], 'get').and.returnValue(null);
      spyOn(view['startRowValueHook_'], 'get').and.returnValue(123);
      spyOn(view['endRowValueHook_'], 'get').and.returnValue(456);
      spyOn(view, 'updateAsset_');
      spyOn(view, 'updatePreview_');

      await view['updateDataSource_']();
      assert(view['updateAsset_']).toNot.haveBeenCalled();
      assert(view['updatePreview_']).toNot.haveBeenCalled();
    });
  });

  describe('updatePreview_', () => {
    it('should update the preview correctly', async () => {
      const data = Mocks.object('data');
      const mockDataSource = jasmine.createSpyObj('DataSource', ['getData']);
      mockDataSource.getData.and.returnValue(data);

      const mockAsset = jasmine.createSpyObj('Asset', ['getData']);
      mockAsset.getData.and.returnValue(mockDataSource);

      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));
      spyOn(view['previewChildrenHook_'], 'delete');
      spyOn(view['previewChildrenHook_'], 'set');

      await view['updatePreview_']();
      assert(view['previewChildrenHook_'].delete).to.haveBeenCalledWith();
      assert(view['previewChildrenHook_'].set).to.haveBeenCalledWith(data);
    });

    it('should clear the preview if the data cannot be loaded', async () => {
      const mockDataSource = jasmine.createSpyObj('DataSource', ['getData']);
      mockDataSource.getData.and.returnValue(null);

      const mockAsset = jasmine.createSpyObj('Asset', ['getData']);
      mockAsset.getData.and.returnValue(mockDataSource);

      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));
      spyOn(view['previewChildrenHook_'], 'delete');
      spyOn(view['previewChildrenHook_'], 'set');

      await view['updatePreview_']();
      assert(view['previewChildrenHook_'].delete).to.haveBeenCalledWith();
      assert(view['previewChildrenHook_'].set).toNot.haveBeenCalled();
    });

    it('should clear the preview if the asset has no data source', async () => {
      const mockAsset = jasmine.createSpyObj('Asset', ['getData']);
      mockAsset.getData.and.returnValue(null);

      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));
      spyOn(view['previewChildrenHook_'], 'delete');
      spyOn(view['previewChildrenHook_'], 'set');

      await view['updatePreview_']();
      assert(view['previewChildrenHook_'].delete).to.haveBeenCalledWith();
      assert(view['previewChildrenHook_'].set).toNot.haveBeenCalled();
    });

    it('should clear the preview if asset cannot be found', async () => {
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(null));
      spyOn(view['previewChildrenHook_'], 'delete');
      spyOn(view['previewChildrenHook_'], 'set');

      await view['updatePreview_']();
      assert(view['previewChildrenHook_'].delete).to.haveBeenCalledWith();
      assert(view['previewChildrenHook_'].set).toNot.haveBeenCalled();
    });
  });
});
