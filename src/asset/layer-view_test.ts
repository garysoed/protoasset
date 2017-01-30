import {assert, Matchers, TestBase} from '../test-base';
TestBase.setup();

import {Mocks} from 'external/gs_tools/src/mock';
import {TestDispose} from 'external/gs_tools/src/testing';

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
    mockRouteService = jasmine.createSpyObj('RouteService', ['getParams']);
    view = new LayerView(
        mockAssetCollection,
        mockOverlayService,
        mockRouteFactoryService,
        mockRouteService,
        Mocks.object('ThemeService'));
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

  describe('selectLayer_', () => {
    it('should update the name and type switch', () => {
      let name = 'name';
      let layerType = LayerType.IMAGE;
      let mockLayer = jasmine.createSpyObj('Layer', ['getName', 'getType']);
      mockLayer.getName.and.returnValue(name);
      mockLayer.getType.and.returnValue(layerType);

      spyOn(view['layerNameBridge_'], 'set');
      spyOn(view['layerTypeSwitchBridge_'], 'set');

      view['selectLayer_'](mockLayer);

      assert(view['layerNameBridge_'].set).to.haveBeenCalledWith(name);
      assert(view['layerTypeSwitchBridge_'].set).to.haveBeenCalledWith(layerType);
    });
  });
});
