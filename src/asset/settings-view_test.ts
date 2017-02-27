import {assert, TestBase} from '../test-base';
TestBase.setup();

import {Serializer} from 'external/gs_tools/src/data';
import {Mocks} from 'external/gs_tools/src/mock';
import {TestDispose} from 'external/gs_tools/src/testing';

import {RouteServiceEvents} from 'external/gs_ui/src/routing';

import {AssetType} from '../data/asset';

import {SettingsView} from './settings-view';


describe('asset.SettingsView', () => {
  let mockAssetCollection;
  let mockDownloadService;
  let mockRouteFactoryService;
  let mockRouteService;
  let view: SettingsView;

  beforeEach(() => {
    mockAssetCollection = jasmine.createSpyObj('AssetCollection', ['get']);
    mockDownloadService = jasmine.createSpyObj('DownloadService', ['downloadJson']);
    mockRouteFactoryService = jasmine.createSpyObj('RouteFactoryService', ['assetSettings']);
    mockRouteService = jasmine.createSpyObj('RouteService', ['getParams', 'on']);
    view = new SettingsView(
        mockAssetCollection,
        mockDownloadService,
        mockRouteFactoryService,
        mockRouteService,
        jasmine.createSpyObj('ThemeService', ['applyTheme']));
    TestDispose.add(view);
  });

  describe('getAsset_', () => {
    it('should resolve with the asset correctly', async (done: any) => {
      const assetSettingsRouteFactory = Mocks.object('assetSettingsRouteFactory');
      mockRouteFactoryService.assetSettings.and.returnValue(assetSettingsRouteFactory);
      const projectId = 'projectId';
      const assetId = 'assetId';
      mockRouteService.getParams.and.returnValue({assetId, projectId});

      const asset = Mocks.object('asset');
      mockAssetCollection.get.and.returnValue(asset);

      assert(await view['getAsset_']()).to.equal(asset);
      assert(mockAssetCollection.get).to.haveBeenCalledWith(projectId, assetId);
      assert(mockRouteService.getParams).to.haveBeenCalledWith(assetSettingsRouteFactory);
    });

    it('should resolve with null if the route params cannot be determined', async (done: any) => {
      const assetSettingsRouteFactory = Mocks.object('assetSettingsRouteFactory');
      mockRouteFactoryService.assetSettings.and.returnValue(assetSettingsRouteFactory);
      mockRouteService.getParams.and.returnValue(null);

      assert(await view['getAsset_']()).to.beNull();
    });
  });

  describe('onAssetChanged_', () => {
    it('should update the name, type, height, and weight correctly', async (done: any) => {
      const height = 456;
      spyOn(view.heightHook_, 'get').and.returnValue(height);

      const width = 123;
      spyOn(view.widthHook_, 'get').and.returnValue(width);

      const assetName = 'assetName';
      spyOn(view.nameHook_, 'get').and.returnValue(assetName);

      const assetType = AssetType.CARD;
      spyOn(view.assetTypeHook_, 'get').and.returnValue(assetType);

      const mockAsset = jasmine
          .createSpyObj('Asset', ['setHeight', 'setName', 'setType', 'setWidth']);
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

      spyOn(view.assetDisplayNameHook_, 'set');

      await view['onAssetChanged_']();
      assert(mockAsset.setType).to.haveBeenCalledWith(assetType);
      assert(mockAsset.setName).to.haveBeenCalledWith(assetName);
      assert(view.assetDisplayNameHook_.set).to.haveBeenCalledWith(assetName);
      assert(mockAsset.setHeight).to.haveBeenCalledWith(height);
      assert(mockAsset.setWidth).to.haveBeenCalledWith(width);
    });

    it('should do nothing if the values are null', async (done: any) => {
      spyOn(view.heightHook_, 'get').and.returnValue(null);
      spyOn(view.widthHook_, 'get').and.returnValue(null);
      spyOn(view.nameHook_, 'get').and.returnValue(null);
      spyOn(view.assetTypeHook_, 'get').and.returnValue(null);

      const mockAsset = jasmine
          .createSpyObj('Asset', ['setHeight', 'setName', 'setType', 'setWidth']);
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

      spyOn(view.assetDisplayNameHook_, 'set');

      await view['onAssetChanged_']();
      assert(mockAsset.setType).toNot.haveBeenCalled();
      assert(mockAsset.setName).toNot.haveBeenCalled();
      assert(view.assetDisplayNameHook_.set).toNot.haveBeenCalled();
      assert(mockAsset.setHeight).toNot.haveBeenCalled();
      assert(mockAsset.setWidth).toNot.haveBeenCalled();
    });

    it('should do nothing if asset cannot be found', async (done: any) => {
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(null));
      spyOn(view.assetDisplayNameHook_, 'set');

      await view['onAssetChanged_']();
      assert(view.assetDisplayNameHook_.set).toNot.haveBeenCalled();
    });
  });

  describe('onCreated', () => {
    it('should listen to route changed event', () => {
      spyOn(view, 'onRouteChanged_');
      view.onCreated(Mocks.object('element'));
      assert(mockRouteService.on).to.haveBeenCalledWith(
          RouteServiceEvents.CHANGED,
          view['onRouteChanged_'],
          view);
      assert(view['onRouteChanged_']).to.haveBeenCalledWith();
    });
  });

  describe('onDownloadClicked_', () => {
    it('should call the download service correctly', async (done: any) => {
      const mockAsset = jasmine.createSpyObj('Asset', ['getName']);
      mockAsset.getName.and.returnValue('assetName');
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

      const serializedJson = Mocks.object('serializedJson');
      spyOn(Serializer, 'toJSON').and.returnValue(serializedJson);

      await view.onDownloadClicked_();
      assert(mockDownloadService.downloadJson).to
          .haveBeenCalledWith(serializedJson, 'asset-name.json');
      assert(Serializer.toJSON).to.haveBeenCalledWith(mockAsset);
    });

    it('should do nothing if asset cannot be found', async (done: any) => {
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(null));
      await view.onDownloadClicked_();
      assert(mockDownloadService.downloadJson).toNot.haveBeenCalled();
    });
  });

  describe('onRouteChanged_', () => {
    it('should update the UI correctly', async (done: any) => {
      const assetName = 'assetName';
      const assetType = AssetType.CARD;
      const height = 123;
      const width = 456;
      const mockAsset =
          jasmine.createSpyObj('Asset', ['getHeight', 'getName', 'getType', 'getWidth']);
      mockAsset.getHeight.and.returnValue(height);
      mockAsset.getName.and.returnValue(assetName);
      mockAsset.getType.and.returnValue(assetType);
      mockAsset.getWidth.and.returnValue(width);
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

      spyOn(view.assetDisplayNameHook_, 'set');
      spyOn(view.assetTypeHook_, 'set');
      spyOn(view.nameHook_, 'set');
      spyOn(view.heightHook_, 'set');
      spyOn(view.widthHook_, 'set');

      await view['onRouteChanged_']();
      assert(view.assetDisplayNameHook_.set).to.haveBeenCalledWith(assetName);
      assert(view.assetTypeHook_.set).to.haveBeenCalledWith(assetType);
      assert(view.nameHook_.set).to.haveBeenCalledWith(assetName);
      assert(view.heightHook_.set).to.haveBeenCalledWith(height);
      assert(view.widthHook_.set).to.haveBeenCalledWith(width);
    });

    it('should do nothing if asset cannot be found', async (done: any) => {
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(null));

      spyOn(view.assetDisplayNameHook_, 'set');
      spyOn(view.assetTypeHook_, 'set');
      spyOn(view.nameHook_, 'set');
      spyOn(view.heightHook_, 'set');
      spyOn(view.widthHook_, 'set');

      await view['onRouteChanged_']();
      assert(view.assetDisplayNameHook_.set).toNot.haveBeenCalled();
      assert(view.assetTypeHook_.set).toNot.haveBeenCalled();
      assert(view.nameHook_.set).toNot.haveBeenCalled();
      assert(view.heightHook_.set).toNot.haveBeenCalled();
      assert(view.widthHook_.set).toNot.haveBeenCalled();
    });
  });
});
