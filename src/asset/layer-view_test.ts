import {assert, Matchers, TestBase} from '../test-base';
TestBase.setup();

import {Mocks} from 'external/gs_tools/src/mock';
import {TestDispose} from 'external/gs_tools/src/testing';

import {RouteServiceEvents} from 'external/gs_ui/src/routing';

import {DataEvents} from '../data/data-events';
import {HtmlLayer} from '../data/html-layer';
import {LayerType} from '../data/layer-type';

import {
  layerItemDataSetter,
  layerItemGenerator,
  layerPreviewDataSetter,
  layerPreviewGenerator,
  LayerView} from './layer-view';


describe('layerItemDataSetter', () => {
  it('should set the correct attributes', () => {
    const assetId = 'assetId';
    const layerId = 'layerId';
    const projectId = 'projectId';
    const mockElement = jasmine.createSpyObj('Element', ['setAttribute']);
    layerItemDataSetter({assetId, layerId, projectId}, mockElement);
    assert(mockElement.setAttribute).to.haveBeenCalledWith('asset-id', assetId);
    assert(mockElement.setAttribute).to.haveBeenCalledWith('layer-id', layerId);
    assert(mockElement.setAttribute).to.haveBeenCalledWith('project-id', projectId);
  });
});

describe('layerItemGenerator', () => {
  it('should generate the correct element', () => {
    const element = Mocks.object('element');
    const mockDocument = jasmine.createSpyObj('Document', ['createElement']);
    mockDocument.createElement.and.returnValue(element);
    assert(layerItemGenerator(mockDocument)).to.equal(element);
    assert(mockDocument.createElement).to.haveBeenCalledWith('pa-asset-layer-item');
  });
});

describe('layerPreviewDataSetter', () => {
  it('should set the attributes correctly', () => {
    const layerId = 'layerId';
    const mockElement = jasmine.createSpyObj('Element', ['setAttribute']);
    layerPreviewDataSetter({isSelected: true, layerId}, mockElement);
    assert(mockElement.setAttribute).to.haveBeenCalledWith('is-selected', 'true');
    assert(mockElement.setAttribute).to.haveBeenCalledWith('layer-id', layerId);
  });
});

describe('layerPreviewGenerator', () => {
  it('should create the element correctly', () => {
    const element = Mocks.object('element');
    const mockDocument = jasmine.createSpyObj('Document', ['createElement']);
    mockDocument.createElement.and.returnValue(element);
    assert(layerPreviewGenerator(mockDocument)).to.equal(element);
    assert(mockDocument.createElement).to.haveBeenCalledWith('pa-asset-layer-preview');
  });
});

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
      const layerRouteFactory = Mocks.object('layerRouteFactory');
      mockRouteFactoryService.layer.and.returnValue(layerRouteFactory);

      const oldId = 'oldId';
      const mockOldLayer = jasmine.createSpyObj('OldLayer', ['getId']);
      mockOldLayer.getId.and.returnValue(oldId);

      const mockAsset = jasmine.createSpyObj('Asset', ['getLayers', 'setLayers']);
      mockAsset.getLayers.and.returnValue([mockOldLayer]);
      mockAssetCollection.get.and.returnValue(Promise.resolve(mockAsset));
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

      const id = 'id';
      spyOn(view['layerIdGenerator_'], 'generate').and.returnValue(oldId);
      spyOn(view['layerIdGenerator_'], 'resolveConflict').and.returnValue(id);

      const selectLayerSpy = spyOn(view, 'selectLayer_');
      const layerType = LayerType.HTML;

      await view['createLayer_'](layerType);
      assert(mockAssetCollection.update).to.haveBeenCalledWith(mockAsset);
      assert(mockOverlayService.hideOverlay).to.haveBeenCalledWith();

      assert(view['selectLayer_']).to.haveBeenCalledWith(Matchers.any(HtmlLayer));
      const layer: HtmlLayer = selectLayerSpy.calls.argsFor(0)[0];
      TestDispose.add(layer);

      assert(mockAsset.setLayers).to.haveBeenCalledWith([layer, mockOldLayer]);
      assert(layer.getName()).to.equal(Matchers.stringMatching(/New html layer/));
      assert(layer.getId()).to.equal(id);
      assert(view['layerIdGenerator_'].resolveConflict).to.haveBeenCalledWith(oldId);
    });

    it('should reject the promise if the layer type is not supported', async (done: any) => {
      const layerRouteFactory = Mocks.object('layerRouteFactory');
      mockRouteFactoryService.layer.and.returnValue(layerRouteFactory);

      const mockAsset = jasmine.createSpyObj('Asset', ['getLayers', 'setLayers']);
      mockAsset.getLayers.and.returnValue([]);
      mockAssetCollection.get.and.returnValue(Promise.resolve(mockAsset));
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

      spyOn(view['layerIdGenerator_'], 'generate').and.returnValue('id');

      try {
        await view['createLayer_'](LayerType.UNKNOWN);
      } catch (e) {
        assert(e).to.equal(Matchers.stringMatching(/Unsupported layer type/));
      }
    });

    it('should do nothing if the asset cannot be found', async (done: any) => {
      const layerRouteFactory = Mocks.object('layerRouteFactory');
      mockRouteFactoryService.layer.and.returnValue(layerRouteFactory);
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(null));

      await view['createLayer_'](LayerType.HTML);
      assert(mockAssetCollection.update).toNot.haveBeenCalled();
    });
  });

  describe('disposeInternal', () => {
    it('should dispose the deregisters', () => {
      const mockAssetChangeDeregister = jasmine.createSpyObj('AssetChangeDeregister', ['dispose']);
      const mockLayerChangeDeregister = jasmine.createSpyObj('LayerChangeDeregister', ['dispose']);
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

  describe('getAsset_', () => {
    it('should resolve with the correct asset', async (done: any) => {
      const layerRouteFactory = Mocks.object('layerRouteFactory');
      mockRouteFactoryService.layer.and.returnValue(layerRouteFactory);

      const projectId = 'projectId';
      const assetId = 'assetId';
      mockRouteService.getParams.and.returnValue({assetId, projectId});

      const asset = Mocks.object('asset');
      mockAssetCollection.get.and.returnValue(Promise.resolve(asset));

      assert(await view['getAsset_']()).to.equal(asset);
      assert(mockAssetCollection.get).to.haveBeenCalledWith(projectId, assetId);
      assert(mockRouteService.getParams).to.haveBeenCalledWith(layerRouteFactory);
    });

    it('should resolve with null if the params cannot be found', async (done: any) => {
      const layerRouteFactory = Mocks.object('layerRouteFactory');
      mockRouteFactoryService.layer.and.returnValue(layerRouteFactory);

      mockRouteService.getParams.and.returnValue(null);

      assert(await view['getAsset_']()).to.beNull();
      assert(mockRouteService.getParams).to.haveBeenCalledWith(layerRouteFactory);
    });
  });

  describe('onAssetChanged_', () => {
    it('should update the UI correctly', async (done: any) => {
      const id = 'id';
      const projectId = 'projectId';
      const mockDataSource = jasmine.createSpyObj('DataSource', ['getData']);
      mockDataSource.getData.and.returnValue(Promise.resolve(['data']));

      const layerId1 = 'layerId1';
      const mockLayer1 = jasmine.createSpyObj('Layer1', ['getId']);
      mockLayer1.getId.and.returnValue(layerId1);

      const layerId2 = 'layerId2';
      const mockLayer2 = jasmine.createSpyObj('Layer2', ['getId']);
      mockLayer2.getId.and.returnValue(layerId2);

      const layerId3 = 'layerId3';
      const mockLayer3 = jasmine.createSpyObj('Layer3', ['getId']);
      mockLayer3.getId.and.returnValue(layerId3);

      const mockAsset =
          jasmine.createSpyObj('Asset', ['getData', 'getId', 'getLayers', 'getProjectId']);
      mockAsset.getData.and.returnValue(mockDataSource);
      mockAsset.getId.and.returnValue(id);
      mockAsset.getProjectId.and.returnValue(projectId);
      mockAsset.getLayers.and.returnValue([mockLayer1, mockLayer2, mockLayer3]);

      spyOn(view.htmlEditorAssetIdHook_, 'set');
      spyOn(view.htmlEditorProjectIdHook_, 'set');
      spyOn(view.imageEditorAssetIdHook_, 'set');
      spyOn(view.imageEditorDataRowHook_, 'set');
      spyOn(view.imageEditorProjectIdHook_, 'set');
      spyOn(view.textEditorAssetIdHook_, 'set');
      spyOn(view.textEditorProjectIdHook_, 'set');
      spyOn(view.layersChildElementHook_, 'set');
      spyOn(view, 'updateLayerPreviews_');

      await view['onAssetChanged_'](mockAsset);
      assert(view.imageEditorDataRowHook_.set).to.haveBeenCalledWith(0);
      assert(view.htmlEditorAssetIdHook_.set).to.haveBeenCalledWith(id);
      assert(view.htmlEditorProjectIdHook_.set).to.haveBeenCalledWith(projectId);
      assert(view.imageEditorAssetIdHook_.set).to.haveBeenCalledWith(id);
      assert(view.imageEditorProjectIdHook_.set).to.haveBeenCalledWith(projectId);
      assert(view.textEditorAssetIdHook_.set).to.haveBeenCalledWith(id);
      assert(view.textEditorProjectIdHook_.set).to.haveBeenCalledWith(projectId);
      assert(view.layersChildElementHook_.set).to.haveBeenCalledWith([
        {assetId: id, layerId: layerId1, projectId},
        {assetId: id, layerId: layerId2, projectId},
        {assetId: id, layerId: layerId3, projectId},
      ]);
      assert(view['updateLayerPreviews_']).to.haveBeenCalledWith();
    });

    it('should not set the data row if the data length is 0', async (done: any) => {
      const mockDataSource = jasmine.createSpyObj('DataSource', ['getData']);
      mockDataSource.getData.and.returnValue(Promise.resolve([]));
      const mockAsset = jasmine.createSpyObj('Asset', ['getData', 'getId', 'getProjectId']);
      mockAsset.getData.and.returnValue(mockDataSource);
      mockAsset.getId.and.returnValue('id');
      mockAsset.getProjectId.and.returnValue('projectId');

      spyOn(view['htmlEditorAssetIdHook_'], 'set');
      spyOn(view['htmlEditorProjectIdHook_'], 'set');
      spyOn(view['imageEditorAssetIdHook_'], 'set');
      spyOn(view['imageEditorDataRowHook_'], 'set');
      spyOn(view['imageEditorProjectIdHook_'], 'set');
      spyOn(view['textEditorAssetIdHook_'], 'set');
      spyOn(view['textEditorProjectIdHook_'], 'set');

      await view['onAssetChanged_'](mockAsset);
      assert(view['imageEditorDataRowHook_'].set).toNot.haveBeenCalled();
    });

    it('should not set the data row if there are no data source', async (done: any) => {
      const mockAsset = jasmine.createSpyObj('Asset', ['getData', 'getId', 'getProjectId']);
      mockAsset.getData.and.returnValue(null);
      mockAsset.getId.and.returnValue('id');
      mockAsset.getProjectId.and.returnValue('projectId');

      spyOn(view['htmlEditorAssetIdHook_'], 'set');
      spyOn(view['htmlEditorProjectIdHook_'], 'set');
      spyOn(view['imageEditorAssetIdHook_'], 'set');
      spyOn(view['imageEditorDataRowHook_'], 'set');
      spyOn(view['imageEditorProjectIdHook_'], 'set');
      spyOn(view['textEditorAssetIdHook_'], 'set');
      spyOn(view['textEditorProjectIdHook_'], 'set');

      await view['onAssetChanged_'](mockAsset);
      assert(view['imageEditorDataRowHook_'].set).toNot.haveBeenCalled();
    });
  });

  describe('onCreated', () => {
    it('should listen to route changed event', () => {
      const element = Mocks.object('element');
      mockRouteService.on.and.returnValue({dispose(): void {}});
      spyOn(view, 'onRouteChanged_');
      view.onCreated(element);
      assert(view['onRouteChanged_']).to.haveBeenCalledWith();
      assert(mockRouteService.on).to
          .haveBeenCalledWith(RouteServiceEvents.CHANGED, view['onRouteChanged_'], view);
    });
  });

  describe('onLayerChanged_', () => {
    it('should update the UI correctly', () => {
      const name = 'name';
      const type = Mocks.object('type');
      const id = 'id';
      const mockLayer = jasmine.createSpyObj('Layer', ['getId', 'getName', 'getType']);
      mockLayer.getId.and.returnValue(id);
      mockLayer.getName.and.returnValue(name);
      mockLayer.getType.and.returnValue(type);

      spyOn(view['layerNameHook_'], 'set');
      spyOn(view['layerTypeSwitchHook_'], 'set');
      spyOn(view['htmlEditorLayerIdHook_'], 'set');
      spyOn(view['imageEditorLayerIdHook_'], 'set');
      spyOn(view['textEditorLayerIdHook_'], 'set');

      view['onLayerChanged_'](mockLayer);
      assert(view['layerNameHook_'].set).to.haveBeenCalledWith(name);
      assert(view['layerTypeSwitchHook_'].set).to.haveBeenCalledWith(type);
      assert(view['htmlEditorLayerIdHook_'].set).to.haveBeenCalledWith(id);
      assert(view['imageEditorLayerIdHook_'].set).to.haveBeenCalledWith(id);
      assert(view['textEditorLayerIdHook_'].set).to.haveBeenCalledWith(id);
    });
  });

  describe('onRouteChanged_', () => {
    it('should select the correct layer, listen to the new asset, and update the UI base on the'
        + ' asset',
        async (done: any) => {
          const mockOldDeregister = jasmine.createSpyObj('OldDeregister', ['dispose']);
          view['assetChangedDeregister_'] = mockOldDeregister;

          const layerRouteFactory = Mocks.object('layerRouteFactory');
          mockRouteFactoryService.layer.and.returnValue(layerRouteFactory);

          const projectId = 'projectId';
          const assetId = 'assetId';
          mockRouteService.getParams.and.returnValue({assetId, projectId});

          const layer = Mocks.object('layer');
          const mockDeregister = jasmine.createSpyObj('Deregister', ['dispose']);
          const mockAsset = jasmine.createSpyObj('Asset', ['getLayers', 'on']);
          mockAsset.getLayers.and.returnValue([layer]);
          mockAsset.on.and.returnValue(mockDeregister);
          mockAssetCollection.get.and.returnValue(Promise.resolve(mockAsset));

          const assetChangedSpy = spyOn(view, 'onAssetChanged_');
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
      const mockOldDeregister = jasmine.createSpyObj('OldDeregister', ['dispose']);
      view['assetChangedDeregister_'] = mockOldDeregister;

      const layerRouteFactory = Mocks.object('layerRouteFactory');
      mockRouteFactoryService.layer.and.returnValue(layerRouteFactory);

      const projectId = 'projectId';
      const assetId = 'assetId';
      mockRouteService.getParams.and.returnValue({assetId, projectId});

      const mockDeregister = jasmine.createSpyObj('Deregister', ['dispose']);
      const mockAsset = jasmine.createSpyObj('Asset', ['getLayers', 'on']);
      mockAsset.getLayers.and.returnValue([]);
      mockAsset.on.and.returnValue(mockDeregister);
      mockAssetCollection.get.and.returnValue(Promise.resolve(mockAsset));

      const assetChangedSpy = spyOn(view, 'onAssetChanged_');
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
      const mockOldDeregister = jasmine.createSpyObj('OldDeregister', ['dispose']);
      view['assetChangedDeregister_'] = mockOldDeregister;

      const layerRouteFactory = Mocks.object('layerRouteFactory');
      mockRouteFactoryService.layer.and.returnValue(layerRouteFactory);

      const projectId = 'projectId';
      const assetId = 'assetId';
      mockRouteService.getParams.and.returnValue({assetId, projectId});

      mockAssetCollection.get.and.returnValue(Promise.resolve(null));

      await view['onRouteChanged_']();

      assert(view['assetChangedDeregister_']).to.beNull();

      assert(mockAssetCollection.get).to.haveBeenCalledWith(projectId, assetId);
      assert(mockRouteService.getParams).to.haveBeenCalledWith(layerRouteFactory);
      assert(mockOldDeregister.dispose).to.haveBeenCalledWith();
    });

    it('should do nothing if params cannot be determined', async (done: any) => {
      const mockOldDeregister = jasmine.createSpyObj('OldDeregister', ['dispose']);
      view['assetChangedDeregister_'] = mockOldDeregister;

      const layerRouteFactory = Mocks.object('layerRouteFactory');
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

          const layerRouteFactory = Mocks.object('layerRouteFactory');
          mockRouteFactoryService.layer.and.returnValue(layerRouteFactory);

          mockRouteService.getParams.and.returnValue(null);

          await view['onRouteChanged_']();

          assert(mockRouteService.getParams).to.haveBeenCalledWith(layerRouteFactory);
        });
  });

  describe('selectLayer_', () => {
    it('should listen to layer changed event and deregister the previous one', () => {
      const mockOldDeregister = jasmine.createSpyObj('OldDeregister', ['dispose']);
      view['layerChangedDeregister_'] = mockOldDeregister;

      const mockDeregister = jasmine.createSpyObj('Deregister', ['dispose']);
      const mockLayer = jasmine.createSpyObj('Layer', ['on']);
      mockLayer.on.and.returnValue(mockDeregister);

      const spyOnLayerChanged = spyOn(view, 'onLayerChanged_');

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

      const mockDeregister = jasmine.createSpyObj('Deregister', ['dispose']);
      const mockLayer = jasmine.createSpyObj('Layer', ['on']);
      mockLayer.on.and.returnValue(mockDeregister);

      spyOn(view, 'onLayerChanged_');

      assert(() => {
        view['selectLayer_'](mockLayer);
      }).toNot.throw();
    });
  });

  describe('updateLayerPreviews_', () => {
    it('should set the layer preview data correctly', async (done: any) => {
      const layerId1 = 'layerId1';
      const mockLayer1 = jasmine.createSpyObj('Layer1', ['getId']);
      mockLayer1.getId.and.returnValue(layerId1);

      const layerId2 = 'layerId2';
      const mockLayer2 = jasmine.createSpyObj('Layer2', ['getId']);
      mockLayer2.getId.and.returnValue(layerId2);

      const mockAsset = jasmine.createSpyObj('Asset', ['getLayers']);
      mockAsset.getLayers.and.returnValue([mockLayer1, mockLayer2]);
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));
      spyOn(view['layerPreviewsChildElementHook_'], 'set');

      view['selectedLayerId_'] = layerId1;
      await view['updateLayerPreviews_']();
      assert(view['layerPreviewsChildElementHook_'].set).to.haveBeenCalledWith([
        {isSelected: true, layerId: layerId1},
        {isSelected: false, layerId: layerId2},
      ]);
    });

    it('should do nothing if asset cannot be found', async (done: any) => {
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(null));
      spyOn(view['layerPreviewsChildElementHook_'], 'set');

      await view['updateLayerPreviews_']();
      assert(view['layerPreviewsChildElementHook_'].set).toNot.haveBeenCalled();
    });
  });
});
