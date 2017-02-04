import {assert, Matchers, TestBase} from '../test-base';
TestBase.setup();

import {Mocks} from 'external/gs_tools/src/mock';
import {TestDispose} from 'external/gs_tools/src/testing';

import {RouteServiceEvents} from 'external/gs_ui/src/routing';

import {DataEvents} from '../data/data-events';
import {HtmlLayer} from '../data/html-layer';
import {LayerType} from '../data/layer-type';

import {LayerView} from './layer-view';


describe('asset.LayerView', () => {
  let mockAssetCollection;
  let mockOverlayService;
  let mockRouteFactoryService;
  let mockRouteService;
  let view: LayerView;

  beforeEach(() => {
    mockAssetCollection = jasmine.createSpyObj('AssetCollection', ['get', 'update']);
    mockOverlayService = jasmine.createSpyObj('OverlayService', ['hideOverlay']);
    mockRouteFactoryService = jasmine.createSpyObj('RouteFactoryService', ['layer']);
    mockRouteService = jasmine.createSpyObj('RouteService', ['getParams', 'on']);
    view = new LayerView(
        mockAssetCollection,
        mockOverlayService,
        mockRouteFactoryService,
        mockRouteService,
        jasmine.createSpyObj('ThemeService', ['applyTheme']));
    TestDispose.add(view);
  });

  describe('createLayer_', () => {
    it('should create the correct layer and update it to the asset', async (done: any) => {
      let layerRouteFactory = Mocks.object('layerRouteFactory');
      mockRouteFactoryService.layer.and.returnValue(layerRouteFactory);

      let projectId = 'projectId';
      let assetId = 'assetId';
      mockRouteService.getParams.and.returnValue({assetId, projectId});

      let oldId = 'oldId';
      let mockOldLayer = jasmine.createSpyObj('OldLayer', ['getId']);
      mockOldLayer.getId.and.returnValue(oldId);

      let mockAsset = jasmine.createSpyObj('Asset', ['getLayers', 'setLayers']);
      mockAsset.getLayers.and.returnValue([mockOldLayer]);
      mockAssetCollection.get.and.returnValue(Promise.resolve(mockAsset));

      let id = 'id';
      spyOn(view['layerIdGenerator_'], 'generate').and.returnValue(oldId);
      spyOn(view['layerIdGenerator_'], 'resolveConflict').and.returnValue(id);

      let selectLayerSpy = spyOn(view, 'selectLayer_');
      let layerType = LayerType.HTML;

      await view['createLayer_'](layerType);
      assert(mockAssetCollection.update).to.haveBeenCalledWith(mockAsset);
      assert(mockOverlayService.hideOverlay).to.haveBeenCalledWith();

      assert(view['selectLayer_']).to.haveBeenCalledWith(Matchers.any(HtmlLayer));
      let layer: HtmlLayer = selectLayerSpy.calls.argsFor(0)[0];
      TestDispose.add(layer);

      assert(mockAsset.setLayers).to.haveBeenCalledWith([layer, mockOldLayer]);
      assert(layer.getName()).to.equal(Matchers.stringMatching(/New html layer/));
      assert(layer.getId()).to.equal(id);
      assert(view['layerIdGenerator_'].resolveConflict).to.haveBeenCalledWith(oldId);

      assert(mockAssetCollection.get).to.haveBeenCalledWith(projectId, assetId);
      assert(mockRouteService.getParams).to.haveBeenCalledWith(layerRouteFactory);
    });

    it('should reject the promise if the layer type is not supported', async (done: any) => {
      let layerRouteFactory = Mocks.object('layerRouteFactory');
      mockRouteFactoryService.layer.and.returnValue(layerRouteFactory);

      let projectId = 'projectId';
      let assetId = 'assetId';
      mockRouteService.getParams.and.returnValue({assetId, projectId});

      let mockAsset = jasmine.createSpyObj('Asset', ['getLayers', 'setLayers']);
      mockAsset.getLayers.and.returnValue([]);
      mockAssetCollection.get.and.returnValue(Promise.resolve(mockAsset));

      spyOn(view['layerIdGenerator_'], 'generate').and.returnValue('id');

      try {
        await view['createLayer_'](LayerType.UNKNOWN);
      } catch (e) {
        assert(e).to.equal(Matchers.stringMatching(/Unsupported layer type/));
      }
    });

    it('should do nothing if the asset cannot be found', async (done: any) => {
      let layerRouteFactory = Mocks.object('layerRouteFactory');
      mockRouteFactoryService.layer.and.returnValue(layerRouteFactory);

      let projectId = 'projectId';
      let assetId = 'assetId';
      mockRouteService.getParams.and.returnValue({assetId, projectId});

      mockAssetCollection.get.and.returnValue(Promise.resolve(null));

      await view['createLayer_'](LayerType.HTML);
      assert(mockAssetCollection.update).toNot.haveBeenCalled();
    });

    it('should do nothing if the params cannot be determined', async (done: any) => {
      let layerRouteFactory = Mocks.object('layerRouteFactory');
      mockRouteFactoryService.layer.and.returnValue(layerRouteFactory);

      mockRouteService.getParams.and.returnValue(null);

      await view['createLayer_'](LayerType.HTML);
      assert(mockAssetCollection.update).toNot.haveBeenCalled();
    });
  });

  describe('onAssetChanged_', () => {
    it('should update the UI correctly', () => {
      let id = 'id';
      let projectId = 'projectId';
      let mockAsset = jasmine.createSpyObj('Asset', ['getId', 'getProjectId']);
      mockAsset.getId.and.returnValue(id);
      mockAsset.getProjectId.and.returnValue(projectId);

      spyOn(view['htmlEditorAssetIdBridge_'], 'set');
      spyOn(view['htmlEditorProjectIdBridge_'], 'set');
      spyOn(view['imageEditorAssetIdBridge_'], 'set');
      spyOn(view['imageEditorProjectIdBridge_'], 'set');
      spyOn(view['textEditorAssetIdBridge_'], 'set');
      spyOn(view['textEditorProjectIdBridge_'], 'set');

      view['onAssetChanged_'](mockAsset);
      assert(view['htmlEditorAssetIdBridge_'].set).to.haveBeenCalledWith(id);
      assert(view['htmlEditorProjectIdBridge_'].set).to.haveBeenCalledWith(projectId);
      assert(view['imageEditorAssetIdBridge_'].set).to.haveBeenCalledWith(id);
      assert(view['imageEditorProjectIdBridge_'].set).to.haveBeenCalledWith(projectId);
      assert(view['textEditorAssetIdBridge_'].set).to.haveBeenCalledWith(id);
      assert(view['textEditorProjectIdBridge_'].set).to.haveBeenCalledWith(projectId);
    });
  });

  describe('onLayerChanged_', () => {
    it('should update the UI correctly', () => {
      let name = 'name';
      let type = Mocks.object('type');
      let id = 'id';
      let mockLayer = jasmine.createSpyObj('Layer', ['getId', 'getName', 'getType']);
      mockLayer.getId.and.returnValue(id);
      mockLayer.getName.and.returnValue(name);
      mockLayer.getType.and.returnValue(type);

      spyOn(view['layerNameBridge_'], 'set');
      spyOn(view['layerTypeSwitchBridge_'], 'set');
      spyOn(view['htmlEditorLayerIdBridge_'], 'set');
      spyOn(view['imageEditorLayerIdBridge_'], 'set');
      spyOn(view['textEditorLayerIdBridge_'], 'set');

      view['onLayerChanged_'](mockLayer);
      assert(view['layerNameBridge_'].set).to.haveBeenCalledWith(name);
      assert(view['layerTypeSwitchBridge_'].set).to.haveBeenCalledWith(type);
      assert(view['htmlEditorLayerIdBridge_'].set).to.haveBeenCalledWith(id);
      assert(view['imageEditorLayerIdBridge_'].set).to.haveBeenCalledWith(id);
      assert(view['textEditorLayerIdBridge_'].set).to.haveBeenCalledWith(id);
    });
  });

  describe('onRouteChanged_', () => {
    it('should select the correct layer, listen to the new asset, and update the UI base on the'
        + ' asset',
        async (done: any) => {
          let mockOldDeregister = jasmine.createSpyObj('OldDeregister', ['dispose']);
          view['assetChangedDeregister_'] = mockOldDeregister;

          let layerRouteFactory = Mocks.object('layerRouteFactory');
          mockRouteFactoryService.layer.and.returnValue(layerRouteFactory);

          let projectId = 'projectId';
          let assetId = 'assetId';
          mockRouteService.getParams.and.returnValue({assetId, projectId});

          let layer = Mocks.object('layer');
          let mockDeregister = jasmine.createSpyObj('Deregister', ['dispose']);
          let mockAsset = jasmine.createSpyObj('Asset', ['getLayers', 'on']);
          mockAsset.getLayers.and.returnValue([layer]);
          mockAsset.on.and.returnValue(mockDeregister);
          mockAssetCollection.get.and.returnValue(Promise.resolve(mockAsset));

          let assetChangedSpy = spyOn(view, 'onAssetChanged_');
          spyOn(view, 'selectLayer_');

          await view['onRouteChanged_']();

          assert(view['selectLayer_']).to.haveBeenCalledWith(layer);
          assert(view['onAssetChanged_']).to.haveBeenCalledWith(mockAsset);

          assert(view['assetChangedDeregister_']).to.equal(mockDeregister);
          assert(mockAsset.on).to.haveBeenCalledWith(
              DataEvents.CHANGED,
              Matchers.any(Function),
              view);

          assetChangedSpy.calls.reset();
          mockAsset.on.calls.argsFor(0)[1]();
          assert(view['onAssetChanged_']).to.haveBeenCalledWith(mockAsset);

          assert(mockAssetCollection.get).to.haveBeenCalledWith(projectId, assetId);
          assert(mockRouteService.getParams).to.haveBeenCalledWith(layerRouteFactory);
          assert(mockOldDeregister.dispose).to.haveBeenCalledWith();
        });

    it('should create a new layer if there are no layers to select', async (done: any) => {
      let mockOldDeregister = jasmine.createSpyObj('OldDeregister', ['dispose']);
      view['assetChangedDeregister_'] = mockOldDeregister;

      let layerRouteFactory = Mocks.object('layerRouteFactory');
      mockRouteFactoryService.layer.and.returnValue(layerRouteFactory);

      let projectId = 'projectId';
      let assetId = 'assetId';
      mockRouteService.getParams.and.returnValue({assetId, projectId});

      let mockDeregister = jasmine.createSpyObj('Deregister', ['dispose']);
      let mockAsset = jasmine.createSpyObj('Asset', ['getLayers', 'on']);
      mockAsset.getLayers.and.returnValue([]);
      mockAsset.on.and.returnValue(mockDeregister);
      mockAssetCollection.get.and.returnValue(Promise.resolve(mockAsset));

      let assetChangedSpy = spyOn(view, 'onAssetChanged_');
      spyOn(view, 'selectLayer_');
      spyOn(view, 'createLayer_').and.returnValue(Promise.resolve());

      await view['onRouteChanged_']();

      assert(view['selectLayer_']).toNot.haveBeenCalled();
      assert(view['createLayer_']).to.haveBeenCalledWith(LayerType.IMAGE);
      assert(view['onAssetChanged_']).to.haveBeenCalledWith(mockAsset);

      assert(view['assetChangedDeregister_']).to.equal(mockDeregister);
      assert(mockAsset.on).to.haveBeenCalledWith(
          DataEvents.CHANGED,
          Matchers.any(Function),
          view);

      assetChangedSpy.calls.reset();
      mockAsset.on.calls.argsFor(0)[1]();
      assert(view['onAssetChanged_']).to.haveBeenCalledWith(mockAsset);

      assert(mockAssetCollection.get).to.haveBeenCalledWith(projectId, assetId);
      assert(mockRouteService.getParams).to.haveBeenCalledWith(layerRouteFactory);
      assert(mockOldDeregister.dispose).to.haveBeenCalledWith();
    });

    it('should do nothing if the asset cannot be found', async (done: any) => {
      let mockOldDeregister = jasmine.createSpyObj('OldDeregister', ['dispose']);
      view['assetChangedDeregister_'] = mockOldDeregister;

      let layerRouteFactory = Mocks.object('layerRouteFactory');
      mockRouteFactoryService.layer.and.returnValue(layerRouteFactory);

      let projectId = 'projectId';
      let assetId = 'assetId';
      mockRouteService.getParams.and.returnValue({assetId, projectId});

      mockAssetCollection.get.and.returnValue(Promise.resolve(null));

      await view['onRouteChanged_']();

      assert(view['assetChangedDeregister_']).to.beNull();

      assert(mockAssetCollection.get).to.haveBeenCalledWith(projectId, assetId);
      assert(mockRouteService.getParams).to.haveBeenCalledWith(layerRouteFactory);
      assert(mockOldDeregister.dispose).to.haveBeenCalledWith();
    });

    it('should do nothing if params cannot be determined', async (done: any) => {
      let mockOldDeregister = jasmine.createSpyObj('OldDeregister', ['dispose']);
      view['assetChangedDeregister_'] = mockOldDeregister;

      let layerRouteFactory = Mocks.object('layerRouteFactory');
      mockRouteFactoryService.layer.and.returnValue(layerRouteFactory);

      mockRouteService.getParams.and.returnValue(null);

      await view['onRouteChanged_']();

      assert(view['assetChangedDeregister_']).to.beNull();

      assert(mockRouteService.getParams).to.haveBeenCalledWith(layerRouteFactory);
      assert(mockOldDeregister.dispose).to.haveBeenCalledWith();
    });

    it('should not reject if there are no previous asset changed deregisters',
        async (done: any) => {
          view['assetChangedDeregister_'] = null;

          let layerRouteFactory = Mocks.object('layerRouteFactory');
          mockRouteFactoryService.layer.and.returnValue(layerRouteFactory);

          mockRouteService.getParams.and.returnValue(null);

          await view['onRouteChanged_']();

          assert(mockRouteService.getParams).to.haveBeenCalledWith(layerRouteFactory);
        });
  });

  describe('selectLayer_', () => {
    it('should listen to layer changed event and deregister the previous one', () => {
      let mockOldDeregister = jasmine.createSpyObj('OldDeregister', ['dispose']);
      view['layerChangedDeregister_'] = mockOldDeregister;

      let mockDeregister = jasmine.createSpyObj('Deregister', ['dispose']);
      let mockLayer = jasmine.createSpyObj('Layer', ['on']);
      mockLayer.on.and.returnValue(mockDeregister);

      let spyOnLayerChanged = spyOn(view, 'onLayerChanged_');

      view['selectLayer_'](mockLayer);

      assert(view['onLayerChanged_']).to.haveBeenCalledWith(mockLayer);
      assert(mockLayer.on).to.haveBeenCalledWith(DataEvents.CHANGED, Matchers.any(Function), view);
      spyOnLayerChanged.calls.reset();

      mockLayer.on.calls.argsFor(0)[1]();
      assert(view['onLayerChanged_']).to.haveBeenCalledWith(mockLayer);
      assert(view['layerChangedDeregister_']).to.equal(mockDeregister);
    });

    it('should not throw error if there are no previous layer changed deregisters', () => {
      view['layerChangedDeregister_'] = null;

      let mockDeregister = jasmine.createSpyObj('Deregister', ['dispose']);
      let mockLayer = jasmine.createSpyObj('Layer', ['on']);
      mockLayer.on.and.returnValue(mockDeregister);

      spyOn(view, 'onLayerChanged_');

      assert(() => {
        view['selectLayer_'](mockLayer);
      }).toNot.throw();
    });
  });

  describe('disposeInternal', () => {
    it('should dispose the deregisters', () => {
      let mockAssetChangeDeregister = jasmine.createSpyObj('AssetChangeDeregister', ['dispose']);
      let mockLayerChangeDeregister = jasmine.createSpyObj('LayerChangeDeregister', ['dispose']);
      view['assetChangedDeregister_'] = mockAssetChangeDeregister;
      view['layerChangedDeregister_'] = mockLayerChangeDeregister;

      view.disposeInternal();

      assert(mockAssetChangeDeregister.dispose).to.haveBeenCalledWith();
      assert(mockLayerChangeDeregister.dispose).to.haveBeenCalledWith();
    });

    it('should not throw error if there are no deregisters', () => {
      assert(() => {
        view.disposeInternal();
      }).toNot.throw();
    });
  });

  describe('onCreated', () => {
    it('should listen to route changed event', () => {
      let element = Mocks.object('element');
      mockRouteService.on.and.returnValue({dispose(): void {}});
      spyOn(view, 'onRouteChanged_');
      view.onCreated(element);
      assert(view['onRouteChanged_']).to.haveBeenCalledWith();
      assert(mockRouteService.on).to
          .haveBeenCalledWith(RouteServiceEvents.CHANGED, view['onRouteChanged_'], view);
    });
  });
});
