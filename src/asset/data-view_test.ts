import { assert, Matchers, TestBase } from '../test-base';
TestBase.setup();

import { DataAccess, FakeDataAccess } from 'external/gs_tools/src/datamodel';
import { FakeMonadSetter } from 'external/gs_tools/src/event';
import { ImmutableList, ImmutableMap } from 'external/gs_tools/src/immutable';
import { Fakes, Mocks } from 'external/gs_tools/src/mock';
import { TestDispose } from 'external/gs_tools/src/testing';

import { Asset2 } from '../data/asset2';
import { TsvDataSource } from '../data/tsv-data-source';
import { DataView, PREVIEW_CHILDREN, PreviewData } from './data-view';


describe('PREVIEW_CHILDREN', () => {
  describe('create', () => {
    it('should return the correct element', () => {
      const element = Mocks.object('element');
      const mockDocument = jasmine.createSpyObj('Document', ['createElement']);
      mockDocument.createElement.and.returnValue(element);
      assert(PREVIEW_CHILDREN.bridge.create(mockDocument, Mocks.object('instance')))
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
      assert(PREVIEW_CHILDREN.bridge.get(element)!).to.haveElements([text1, text2]);
    });

    it('should return null if one of the values is null', () => {
      const text = 'text';
      const element = Mocks.object('element');
      element.children = Mocks.itemList([
        {textContent: text},
        {textContent: null},
      ]);
      assert(PREVIEW_CHILDREN.bridge.get(element)).to.beNull();
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

      PREVIEW_CHILDREN.bridge.set(
          ImmutableList.of([data1, data2]),
          mockRoot,
          Mocks.object('instance'));

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

      PREVIEW_CHILDREN.bridge.set(
          ImmutableList.of([data1, data2]),
          mockRoot,
          Mocks.object('instance'));

      assert(cell1.textContent).to.equal(data1);
      assert(cell2.textContent).to.equal(data2);
      assert(mockRoot.appendChild).toNot.haveBeenCalled();
      assert(mockChildrenList.item).to.haveBeenCalledWith(0);
      assert(mockChildrenList.item).to.haveBeenCalledWith(1);
    });
  });
});


describe('asset.DataView', () => {
  let mockFileService: any;
  let mockRouteFactoryService: any;
  let mockRouteService: any;
  let view: DataView;

  beforeEach(() => {
    mockFileService = jasmine.createSpyObj('FileService', ['processBundle']);
    mockRouteFactoryService = jasmine.createSpyObj('RouteFactoryService', ['assetData']);
    mockRouteService = jasmine.createSpyObj('RouteService', ['getParams']);

    view = new DataView(
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

      const asset = Asset2.withId(assetId);
      const fakeAssetDataAccess = new FakeDataAccess<Asset2>(ImmutableMap.of([[assetId, asset]]));

      const actualAsset = await view['getAsset_'](fakeAssetDataAccess);
      assert(actualAsset).to.equal(asset);
      assert(mockRouteService.getParams).to.haveBeenCalledWith(assetDataFactory);
    });

    it('should return null if route params cannot be resolved', async () => {
      mockRouteService.getParams.and.returnValue(null);
      mockRouteFactoryService.assetData.and.returnValue(Mocks.object('assetDataFactory'));
      const fakeAssetDataAccess = new FakeDataAccess<Asset2>();

      const actualAsset = await view['getAsset_'](fakeAssetDataAccess);
      assert(actualAsset).to.beNull();
    });
  });

  describe('updateAsset_', () => {
    it('should update the asset correctly with the given data source', async () => {
      const dataSource = Mocks.object('dataSource');
      const assetId = 'assetId';
      const asset = Asset2.withId(assetId);
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(asset));

      const fakeAssetDataAccess = new FakeDataAccess<Asset2>(ImmutableMap.of([[assetId, asset]]));

      const newDataAccess = await view['updateAsset_'](dataSource, fakeAssetDataAccess);
      assert(newDataAccess.getUpdateQueue().get(assetId)!.getData()).to.equal(dataSource);
    });

    it('should not reject if asset cannot be found', async () => {
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(null));
      const fakeAssetDataAccess = new FakeDataAccess<Asset2>();

      const dataAccess =
          await view['updateAsset_'](Mocks.object('dataSource'), fakeAssetDataAccess);
      assert(dataAccess.getUpdateQueue()).to.haveElements([]);
    });
  });

  describe('updateDataSource_', () => {
    it('should update the asset and preview correctly', async () => {
      const bundleId = 'bundleId';
      const startRow = 0;
      const endRow = 2;
      const content = [
        ['a', 'b', 'c'].join('\t'),
        ['1', '2'].join('\t'),
      ].join('\n');
      mockFileService.processBundle.and
          .returnValue(Promise.resolve(new Map([[Mocks.object('File'), content]])));

      const newDataAccess = Mocks.object('newDataAccess');
      const updateAssetSpy = spyOn(view, 'updateAsset_')
          .and.returnValue(Promise.resolve(newDataAccess));

      const fakeAssetAccess = new FakeDataAccess<Asset2>();
      const fakeAssetAccessSetter = new FakeMonadSetter<DataAccess<Asset2>>(fakeAssetAccess);

      const updates =
          await view.updateDataSource_(bundleId, startRow, endRow, fakeAssetAccessSetter);
      assert(view['updateAsset_']).to.haveBeenCalledWith(Matchers.anyThing(), fakeAssetAccess);

      const dataSource: TsvDataSource = updateAssetSpy.calls.argsFor(0)[0];
      const data = await dataSource.getData();
      assert(data.size()).to.equal(2);
      assert(data.getAt(0)!).to.haveElements(['a', 'b', 'c']);
      assert(data.getAt(1)!).to.haveElements(['1', '2']);
      assert(dataSource.getStartRow()).to.equal(startRow);
      assert(dataSource.getEndRow()).to.equal(endRow);

      assert(fakeAssetAccessSetter.findValue(updates)!.value).to.equal(newDataAccess);
      assert(mockFileService.processBundle).to.haveBeenCalledWith(bundleId);
    });

    it('should not update the asset if there are no files in the bundle', async () => {
        mockFileService.processBundle.and.returnValue(Promise.resolve(new Map()));

        spyOn(view, 'updateAsset_');

        const fakeAssetAccess = new FakeDataAccess<Asset2>();
        const fakeAssetAccessSetter = new FakeMonadSetter<DataAccess<Asset2>>(fakeAssetAccess);

        const updates = await view.updateDataSource_('bundleId', 123, 456, fakeAssetAccessSetter);
        assert(updates).to.equal([]);
        assert(view['updateAsset_']).toNot.haveBeenCalled();
      });

    it('should not update the asset, if the bundle cannot be processed', async () => {
      mockFileService.processBundle.and.returnValue(Promise.resolve(null));

      spyOn(view, 'updateAsset_');

      const fakeAssetAccess = new FakeDataAccess<Asset2>();
      const fakeAssetAccessSetter = new FakeMonadSetter<DataAccess<Asset2>>(fakeAssetAccess);

      const updates = await view.updateDataSource_('bundleId', 123, 456, fakeAssetAccessSetter);
      assert(updates).to.equal([]);
      assert(view['updateAsset_']).toNot.haveBeenCalled();
    });

    it('should do nothing if the start row is NaN', async () => {
      spyOn(view, 'updateAsset_');

      const fakeAssetAccess = new FakeDataAccess<Asset2>();
      const fakeAssetAccessSetter = new FakeMonadSetter<DataAccess<Asset2>>(fakeAssetAccess);

      const updates = await view.updateDataSource_('bundleId', NaN, 456, fakeAssetAccessSetter);
      assert(updates).to.equal([]);
      assert(view['updateAsset_']).toNot.haveBeenCalled();
    });

    it('should do nothing if the start row is null', async () => {
      spyOn(view, 'updateAsset_');

      const fakeAssetAccess = new FakeDataAccess<Asset2>();
      const fakeAssetAccessSetter = new FakeMonadSetter<DataAccess<Asset2>>(fakeAssetAccess);

      const updates = await view.updateDataSource_('bundleId', null, 456, fakeAssetAccessSetter);
      assert(updates).to.equal([]);
      assert(view['updateAsset_']).toNot.haveBeenCalled();
    });

    it('should do nothing if the end row is NaN', async () => {
      spyOn(view, 'updateAsset_');

      const fakeAssetAccess = new FakeDataAccess<Asset2>();
      const fakeAssetAccessSetter = new FakeMonadSetter<DataAccess<Asset2>>(fakeAssetAccess);

      const updates = await view.updateDataSource_('bundleId', 123, NaN, fakeAssetAccessSetter);
      assert(updates).to.equal([]);
      assert(view['updateAsset_']).toNot.haveBeenCalled();
    });

    it('should do nothing if the end row is null', async () => {
      spyOn(view, 'updateAsset_');

      const fakeAssetAccess = new FakeDataAccess<Asset2>();
      const fakeAssetAccessSetter = new FakeMonadSetter<DataAccess<Asset2>>(fakeAssetAccess);

      const updates = await view.updateDataSource_('bundleId', 123, null, fakeAssetAccessSetter);
      assert(updates).to.equal([]);
      assert(view['updateAsset_']).toNot.haveBeenCalled();
    });

    it('should do nothing if the bundle ID cannot be found', async () => {
      spyOn(view, 'updateAsset_');

      const fakeAssetAccess = new FakeDataAccess<Asset2>();
      const fakeAssetAccessSetter = new FakeMonadSetter<DataAccess<Asset2>>(fakeAssetAccess);

      const updates = await view.updateDataSource_(null, 123, 456, fakeAssetAccessSetter);
      assert(updates).to.equal([]);
      assert(view['updateAsset_']).toNot.haveBeenCalled();
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

      const fakePreviewChildrenSetter = new FakeMonadSetter<PreviewData | null>(null);
      const fakeAssetAccess = new FakeDataAccess<Asset2>();

      const updates = await view.updatePreview_(true, fakeAssetAccess, fakePreviewChildrenSetter);
      assert(fakePreviewChildrenSetter.findValue(updates)!.value).to.equal(data);
      assert(view['getAsset_']).to.haveBeenCalledWith(fakeAssetAccess);
    });

    it('should clear the preview if the data cannot be loaded', async () => {
      const mockDataSource = jasmine.createSpyObj('DataSource', ['getData']);
      mockDataSource.getData.and.returnValue(null);

      const mockAsset = jasmine.createSpyObj('Asset', ['getData']);
      mockAsset.getData.and.returnValue(mockDataSource);

      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

      const fakePreviewChildrenSetter = new FakeMonadSetter<PreviewData | null>(null);
      const fakeAssetAccess = new FakeDataAccess<Asset2>();

      const updates = await view.updatePreview_(true, fakeAssetAccess, fakePreviewChildrenSetter);
      assert(fakePreviewChildrenSetter.findValue(updates)!.value).to.beNull();
      assert(view['getAsset_']).to.haveBeenCalledWith(fakeAssetAccess);
    });

    it('should clear the preview if the asset has no data source', async () => {
      const mockAsset = jasmine.createSpyObj('Asset', ['getData']);
      mockAsset.getData.and.returnValue(null);

      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

      const fakePreviewChildrenSetter = new FakeMonadSetter<PreviewData | null>(null);
      const fakeAssetAccess = new FakeDataAccess<Asset2>();

      const updates = await view.updatePreview_(true, fakeAssetAccess, fakePreviewChildrenSetter);
      assert(fakePreviewChildrenSetter.findValue(updates)!.value).to.beNull();
      assert(view['getAsset_']).to.haveBeenCalledWith(fakeAssetAccess);
    });

    it('should clear the preview if asset cannot be found', async () => {
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(null));

      const fakePreviewChildrenSetter = new FakeMonadSetter<PreviewData | null>(null);
      const fakeAssetAccess = new FakeDataAccess<Asset2>();

      const updates = await view.updatePreview_(true, fakeAssetAccess, fakePreviewChildrenSetter);
      assert(fakePreviewChildrenSetter.findValue(updates)!.value).to.beNull();
      assert(view['getAsset_']).to.haveBeenCalledWith(fakeAssetAccess);
    });

    it(`should do nothing if the view is not active`, async () => {
      spyOn(view, 'getAsset_');

      const fakePreviewChildrenSetter = new FakeMonadSetter<PreviewData | null>(null);
      const fakeAssetAccess = new FakeDataAccess<Asset2>();

      const updates = await view.updatePreview_(false, fakeAssetAccess, fakePreviewChildrenSetter);
      assert(updates).to.equal([]);
    });
  });
});
