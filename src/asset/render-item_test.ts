import { assert, TestBase } from '../test-base';
TestBase.setup();

import { Mocks } from 'external/gs_tools/src/mock';
import { TestDispose } from 'external/gs_tools/src/testing';

import { RenderItem } from '../asset/render-item';


describe('asset.RenderItem', () => {
  let mockAssetCollection;
  let mockRenderService;
  let item: RenderItem;

  beforeEach(() => {
    mockAssetCollection = jasmine.createSpyObj('AssetCollection', ['get']);
    mockRenderService = jasmine.createSpyObj('RenderService', ['render']);
    item = new RenderItem(
        mockAssetCollection,
        mockRenderService,
        Mocks.object('ThemeService'));
    TestDispose.add(item);
  });

  describe('onRenderDataChanged_', () => {
    it('should render correctly', async (done: any) => {
      spyOn(item.loadingHiddenHook_, 'set');

      const projectId = 'projectId';
      spyOn(item.projectIdHook_, 'get').and.returnValue(projectId);

      const assetId = 'assetId';
      spyOn(item.assetIdHook_, 'get').and.returnValue(assetId);

      const renderKey = 'renderKey';
      spyOn(item.renderKeyHook_, 'get').and.returnValue(renderKey);

      const row = 123;
      spyOn(item.rowHook_, 'get').and.returnValue(row);

      spyOn(item, 'render_');

      const data = Mocks.object('data');
      const allData: any[] = [];
      allData[row] = data;
      const mockDataSource = jasmine.createSpyObj('DataSource', ['getData']);
      mockDataSource.getData.and.returnValue(Promise.resolve(allData));

      const mockAsset = jasmine.createSpyObj('Asset', ['getData']);
      mockAsset.getData.and.returnValue(mockDataSource);
      mockAssetCollection.get.and.returnValue(Promise.resolve(mockAsset));

      await item.onRenderDataChanged_();
      assert(item['render_']).to.haveBeenCalledWith(mockAsset, data, renderKey);
      assert(mockAssetCollection.get).to.haveBeenCalledWith(projectId, assetId);
      assert(item.loadingHiddenHook_.set).to.haveBeenCalledWith(false);
    });

    it('should do nothing if the data cannot be found', async (done: any) => {
      spyOn(item.loadingHiddenHook_, 'set');

      const projectId = 'projectId';
      spyOn(item.projectIdHook_, 'get').and.returnValue(projectId);

      const assetId = 'assetId';
      spyOn(item.assetIdHook_, 'get').and.returnValue(assetId);

      const renderKey = 'renderKey';
      spyOn(item.renderKeyHook_, 'get').and.returnValue(renderKey);

      const row = 123;
      spyOn(item.rowHook_, 'get').and.returnValue(row);

      spyOn(item, 'render_');

      const allData: any[] = [];
      const mockDataSource = jasmine.createSpyObj('DataSource', ['getData']);
      mockDataSource.getData.and.returnValue(Promise.resolve(allData));

      const mockAsset = jasmine.createSpyObj('Asset', ['getData']);
      mockAsset.getData.and.returnValue(mockDataSource);
      mockAssetCollection.get.and.returnValue(Promise.resolve(mockAsset));

      await item.onRenderDataChanged_();
      assert(item['render_']).toNot.haveBeenCalled();
      assert(item.loadingHiddenHook_.set).to.haveBeenCalledWith(false);
    });

    it('should do nothing if there are no data source', async (done: any) => {
      spyOn(item.loadingHiddenHook_, 'set');

      const projectId = 'projectId';
      spyOn(item.projectIdHook_, 'get').and.returnValue(projectId);

      const assetId = 'assetId';
      spyOn(item.assetIdHook_, 'get').and.returnValue(assetId);

      const renderKey = 'renderKey';
      spyOn(item.renderKeyHook_, 'get').and.returnValue(renderKey);

      const row = 123;
      spyOn(item.rowHook_, 'get').and.returnValue(row);

      spyOn(item, 'render_');

      const mockAsset = jasmine.createSpyObj('Asset', ['getData']);
      mockAsset.getData.and.returnValue(null);
      mockAssetCollection.get.and.returnValue(Promise.resolve(mockAsset));

      await item.onRenderDataChanged_();
      assert(item['render_']).toNot.haveBeenCalled();
      assert(item.loadingHiddenHook_.set).to.haveBeenCalledWith(false);
    });

    it('should do nothing if there are no assets', async (done: any) => {
      spyOn(item.loadingHiddenHook_, 'set');

      const projectId = 'projectId';
      spyOn(item.projectIdHook_, 'get').and.returnValue(projectId);

      const assetId = 'assetId';
      spyOn(item.assetIdHook_, 'get').and.returnValue(assetId);

      const renderKey = 'renderKey';
      spyOn(item.renderKeyHook_, 'get').and.returnValue(renderKey);

      const row = 123;
      spyOn(item.rowHook_, 'get').and.returnValue(row);

      spyOn(item, 'render_');

      mockAssetCollection.get.and.returnValue(Promise.resolve(null));

      await item.onRenderDataChanged_();
      assert(item['render_']).toNot.haveBeenCalled();
      assert(item.loadingHiddenHook_.set).to.haveBeenCalledWith(false);
    });

    it('should do nothing if assetId cannot be found', async (done: any) => {
      spyOn(item.loadingHiddenHook_, 'set');

      const projectId = 'projectId';
      spyOn(item.projectIdHook_, 'get').and.returnValue(projectId);

      spyOn(item.assetIdHook_, 'get').and.returnValue(null);

      const renderKey = 'renderKey';
      spyOn(item.renderKeyHook_, 'get').and.returnValue(renderKey);

      const row = 123;
      spyOn(item.rowHook_, 'get').and.returnValue(row);

      spyOn(item, 'render_');

      await item.onRenderDataChanged_();
      assert(item['render_']).toNot.haveBeenCalled();
      assert(item.loadingHiddenHook_.set).to.haveBeenCalledWith(false);
    });

    it('should do nothing if projectId cannot be found', async (done: any) => {
      spyOn(item.loadingHiddenHook_, 'set');

      spyOn(item.projectIdHook_, 'get').and.returnValue(null);

      const assetId = 'assetId';
      spyOn(item.assetIdHook_, 'get').and.returnValue(assetId);

      const renderKey = 'renderKey';
      spyOn(item.renderKeyHook_, 'get').and.returnValue(renderKey);

      const row = 123;
      spyOn(item.rowHook_, 'get').and.returnValue(row);

      spyOn(item, 'render_');

      await item.onRenderDataChanged_();
      assert(item['render_']).toNot.haveBeenCalled();
      assert(item.loadingHiddenHook_.set).to.haveBeenCalledWith(false);
    });

    it('should do nothing if renderKey cannot be found', async (done: any) => {
      spyOn(item.loadingHiddenHook_, 'set');

      const projectId = 'projectId';
      spyOn(item.projectIdHook_, 'get').and.returnValue(projectId);

      const assetId = 'assetId';
      spyOn(item.assetIdHook_, 'get').and.returnValue(assetId);

      spyOn(item.renderKeyHook_, 'get').and.returnValue(null);

      const row = 123;
      spyOn(item.rowHook_, 'get').and.returnValue(row);

      spyOn(item, 'render_');

      await item.onRenderDataChanged_();
      assert(item['render_']).toNot.haveBeenCalled();
      assert(item.loadingHiddenHook_.set).to.haveBeenCalledWith(false);
    });

    it('should do nothing if row cannot be found', async (done: any) => {
      spyOn(item.loadingHiddenHook_, 'set');

      const projectId = 'projectId';
      spyOn(item.projectIdHook_, 'get').and.returnValue(projectId);

      const assetId = 'assetId';
      spyOn(item.assetIdHook_, 'get').and.returnValue(assetId);

      const renderKey = 'renderKey';
      spyOn(item.renderKeyHook_, 'get').and.returnValue(renderKey);

      spyOn(item.rowHook_, 'get').and.returnValue(null);

      spyOn(item, 'render_');

      await item.onRenderDataChanged_();
      assert(item['render_']).toNot.haveBeenCalled();
      assert(item.loadingHiddenHook_.set).to.haveBeenCalledWith(false);
    });
  });

  describe('render_', () => {
    it('should set the background image and output attribute correctly', async (done: any) => {
      const asset = Mocks.object('asset');
      const data = Mocks.object('data');

      const displayStyle = Mocks.object('displayStyle');
      spyOn(item.displayStyleHook_, 'get').and.returnValue(displayStyle);

      const dataUri = 'dataUri';
      mockRenderService.render.and.returnValue(Promise.resolve(dataUri));

      const key = 'key';
      spyOn(item.renderKeyHook_, 'get').and.returnValue(key);

      spyOn(item.loadingHiddenHook_, 'get').and.returnValue(false);
      spyOn(item.loadingHiddenHook_, 'set');

      spyOn(item.renderOutHook_, 'set');

      await item['render_'](asset, data, key);
      assert(item.renderOutHook_.set).to.haveBeenCalledWith(dataUri);
      assert(displayStyle.backgroundImage).to.equal(`url(${dataUri})`);
      assert(item.loadingHiddenHook_.set).to.haveBeenCalledWith(true);
      assert(mockRenderService.render).to.haveBeenCalledWith(asset, data);
    });

    it('should just hide the loading indicator if dataUri cannot be found', async (done: any) => {
      const asset = Mocks.object('asset');
      const data = Mocks.object('data');

      const displayStyle = Mocks.object('displayStyle');
      spyOn(item.displayStyleHook_, 'get').and.returnValue(displayStyle);

      mockRenderService.render.and.returnValue(Promise.resolve(null));

      const key = 'key';
      spyOn(item.renderKeyHook_, 'get').and.returnValue(key);

      spyOn(item.loadingHiddenHook_, 'get').and.returnValue(false);
      spyOn(item.loadingHiddenHook_, 'set');

      spyOn(item.renderOutHook_, 'set');

      await item['render_'](asset, data, key);
      assert(item.renderOutHook_.set).toNot.haveBeenCalled();
      assert(displayStyle.backgroundImage).toNot.beDefined();
      assert(item.loadingHiddenHook_.set).to.haveBeenCalledWith(true);
      assert(mockRenderService.render).to.haveBeenCalledWith(asset, data);
    });

    it('should just hide the loading indicator if the style of display element cannot be found',
        async (done: any) => {
          const asset = Mocks.object('asset');
          const data = Mocks.object('data');

          spyOn(item.displayStyleHook_, 'get').and.returnValue(null);

          const dataUri = 'dataUri';
          mockRenderService.render.and.returnValue(Promise.resolve(dataUri));

          const key = 'key';
          spyOn(item.renderKeyHook_, 'get').and.returnValue(key);

          spyOn(item.loadingHiddenHook_, 'get').and.returnValue(false);
          spyOn(item.loadingHiddenHook_, 'set');

          spyOn(item.renderOutHook_, 'set');

          await item['render_'](asset, data, key);
          assert(item.renderOutHook_.set).toNot.haveBeenCalled();
          assert(item.loadingHiddenHook_.set).to.haveBeenCalledWith(true);
          assert(mockRenderService.render).to.haveBeenCalledWith(asset, data);
        });

    it('should not hide the loading indicator if the render key has changed',
        async (done: any) => {
          const asset = Mocks.object('asset');
          const data = Mocks.object('data');

          spyOn(item.displayStyleHook_, 'get').and.returnValue(null);

          const dataUri = 'dataUri';
          mockRenderService.render.and.returnValue(Promise.resolve(dataUri));

          const key = 'key';
          spyOn(item.renderKeyHook_, 'get').and.returnValue('otherKey');

          spyOn(item.loadingHiddenHook_, 'get').and.returnValue(false);
          spyOn(item.loadingHiddenHook_, 'set');

          await item['render_'](asset, data, key);
          assert(item.loadingHiddenHook_.set).toNot.haveBeenCalled();
          assert(mockRenderService.render).to.haveBeenCalledWith(asset, data);
        });

    it('should do nothing if loading indicator is not displayed', async (done: any) => {
      const asset = Mocks.object('asset');
      const data = Mocks.object('data');

      spyOn(item.renderKeyHook_, 'get').and.returnValue('otherKey');
      spyOn(item.loadingHiddenHook_, 'get').and.returnValue(true);
      spyOn(item.loadingHiddenHook_, 'set');

      await item['render_'](asset, data, 'key');
      assert(item.loadingHiddenHook_.set).toNot.haveBeenCalled();
      assert(mockRenderService.render).toNot.haveBeenCalled();
    });
  });
});
