import { assert, Matchers, TestBase } from '../test-base';
TestBase.setup();

import { DomEvent, ListenableDom } from 'external/gs_tools/src/event';
import { Fakes, Mocks } from 'external/gs_tools/src/mock';
import { BooleanParser, EnumParser } from 'external/gs_tools/src/parse';
import { TestDispose } from 'external/gs_tools/src/testing';

import { RouteServiceEvents } from 'external/gs_ui/src/routing';

import {
  LAYER_ITEM_DATA_HELPER,
  LAYER_PREVIEW_DATA_HELPER,
  LAYER_PREVIEW_MODE_DATA_HELPER,
  LayerView } from '../asset/layer-view';
import { DataEvents } from '../data/data-events';
import { HtmlLayer } from '../data/html-layer';
import { LayerPreviewMode } from '../data/layer-preview-mode';
import { LayerType } from '../data/layer-type';


describe('LAYER_ITEM_DATA_HELPER', () => {
  describe('create', () => {
    it('should generate the correct element', () => {
      const layerId = 'layerId';
      const mockElement = jasmine.createSpyObj('Element', ['getAttribute']);
      mockElement.getAttribute.and.returnValue(layerId);

      const disposableFunction = Mocks.object('disposableFunction');
      const mockListenableDom = jasmine.createSpyObj('ListenableDom', ['on']);
      mockListenableDom.on.and.returnValue(disposableFunction);
      spyOn(ListenableDom, 'of').and.returnValue(mockListenableDom);

      const mockDocument = jasmine.createSpyObj('Document', ['createElement']);
      mockDocument.createElement.and.returnValue(mockElement);
      const mockInstance =
          jasmine.createSpyObj('Instance', ['addDisposable', 'onLayerItemClick_']);
      assert(LAYER_ITEM_DATA_HELPER.create(mockDocument, mockInstance)).to.equal(mockElement);
      assert(mockDocument.createElement).to.haveBeenCalledWith('pa-asset-layer-item');
      assert(mockInstance.addDisposable).to.haveBeenCalledWith(mockListenableDom);
      assert(mockInstance.addDisposable).to.haveBeenCalledWith(disposableFunction);

      assert(mockListenableDom.on).to
          .haveBeenCalledWith(DomEvent.CLICK, Matchers.any(Function), mockInstance);
      mockListenableDom.on.calls.argsFor(0)[1]();
      assert(mockInstance.onLayerItemClick_).to.haveBeenCalledWith(layerId);
      assert(mockElement.getAttribute).to.haveBeenCalledWith('layer-id');

      assert(ListenableDom.of).to.haveBeenCalledWith(mockElement);
    });
  });

  describe('get', () => {
    it('should return the data correctly', () => {
      const assetId = 'assetId';
      const layerId = 'layerId';
      const projectId = 'projectId';
      const mockElement = jasmine.createSpyObj('Element', ['getAttribute']);
      Fakes.build(mockElement.getAttribute)
          .when('asset-id').return(assetId)
          .when('layer-id').return(layerId)
          .when('project-id').return(projectId);
      assert(LAYER_ITEM_DATA_HELPER.get(mockElement)).to.equal({assetId, layerId, projectId});
      assert(mockElement.getAttribute).to.haveBeenCalledWith('asset-id');
      assert(mockElement.getAttribute).to.haveBeenCalledWith('layer-id');
      assert(mockElement.getAttribute).to.haveBeenCalledWith('project-id');
    });

    it('should return null if assetId is null', () => {
      const mockElement = jasmine.createSpyObj('Element', ['getAttribute']);
      Fakes.build(mockElement.getAttribute)
          .when('asset-id').return(null)
          .when('layer-id').return('layerId')
          .when('project-id').return('projectId');
      assert(LAYER_ITEM_DATA_HELPER.get(mockElement)).to.beNull();
    });

    it('should return null if layerId is null', () => {
      const mockElement = jasmine.createSpyObj('Element', ['getAttribute']);
      Fakes.build(mockElement.getAttribute)
          .when('asset-id').return('assetId')
          .when('layer-id').return(null)
          .when('project-id').return('projectId');
      assert(LAYER_ITEM_DATA_HELPER.get(mockElement)).to.beNull();
    });

    it('should return null if projectId is null', () => {
      const mockElement = jasmine.createSpyObj('Element', ['getAttribute']);
      Fakes.build(mockElement.getAttribute)
          .when('asset-id').return('assetId')
          .when('layer-id').return('layerId')
          .when('project-id').return(null);
      assert(LAYER_ITEM_DATA_HELPER.get(mockElement)).to.beNull();
    });
  });

  describe('set', () => {
    it('should set the correct attributes', () => {
      const assetId = 'assetId';
      const layerId = 'layerId';
      const projectId = 'projectId';
      const mockElement = jasmine.createSpyObj('Element', ['setAttribute']);
      LAYER_ITEM_DATA_HELPER
          .set({assetId, layerId, projectId}, mockElement, Mocks.object('instance'));
      assert(mockElement.setAttribute).to.haveBeenCalledWith('asset-id', assetId);
      assert(mockElement.setAttribute).to.haveBeenCalledWith('layer-id', layerId);
      assert(mockElement.setAttribute).to.haveBeenCalledWith('project-id', projectId);
    });
  });
});


describe('LAYER_PREVIEW_DATA_HELPER', () => {
  describe('create', () => {
    it('should create the element correctly', () => {
      const element = Mocks.object('element');
      const mockDocument = jasmine.createSpyObj('Document', ['createElement']);
      mockDocument.createElement.and.returnValue(element);
      assert(LAYER_PREVIEW_DATA_HELPER.create(mockDocument, Mocks.object('instance')))
          .to.equal(element);
      assert(mockDocument.createElement).to.haveBeenCalledWith('pa-asset-layer-preview');
    });
  });

  describe('get', () => {
    it('should return the correct data', () => {
      const isSelected = true;
      const layerId = 'layerId';
      const mode = LayerPreviewMode.NORMAL;
      const mockElement = jasmine.createSpyObj('Element', ['getAttribute']);
      Fakes.build(mockElement.getAttribute)
          .when('is-selected').return(BooleanParser.stringify(isSelected))
          .when('layer-id').return(layerId)
          .when('preview-mode').return(EnumParser(LayerPreviewMode).stringify(mode));
      assert(LAYER_PREVIEW_DATA_HELPER.get(mockElement)).to.equal({isSelected, layerId, mode});
      assert(mockElement.getAttribute).to.haveBeenCalledWith('is-selected');
      assert(mockElement.getAttribute).to.haveBeenCalledWith('layer-id');
      assert(mockElement.getAttribute).to.haveBeenCalledWith('preview-mode');
    });

    it('should return null if isSelected is null', () => {
      const mockElement = jasmine.createSpyObj('Element', ['getAttribute']);
      Fakes.build(mockElement.getAttribute)
          .when('is-selected').return(null)
          .when('layer-id').return('layerId')
          .when('preview-mode')
              .return(EnumParser(LayerPreviewMode).stringify(LayerPreviewMode.NORMAL));
      assert(LAYER_PREVIEW_DATA_HELPER.get(mockElement)).to.beNull();
    });

    it('should return null if layer ID is null', () => {
      const mockElement = jasmine.createSpyObj('Element', ['getAttribute']);
      Fakes.build(mockElement.getAttribute)
          .when('is-selected').return(BooleanParser.stringify(true))
          .when('layer-id').return(null)
          .when('preview-mode')
              .return(EnumParser(LayerPreviewMode).stringify(LayerPreviewMode.NORMAL));
      assert(LAYER_PREVIEW_DATA_HELPER
          .get(mockElement)).to.beNull();
    });

    it('should return null if previewMode is null', () => {
      const mockElement = jasmine.createSpyObj('Element', ['getAttribute']);
      Fakes.build(mockElement.getAttribute)
          .when('is-selected').return(BooleanParser.stringify(true))
          .when('layer-id').return('layerId')
          .when('preview-mode').return(null);
      assert(LAYER_PREVIEW_DATA_HELPER.get(mockElement)).to.beNull();
    });
  });

  describe('set', () => {
    it('should set the attributes correctly', () => {
      const layerId = 'layerId';
      const mockElement = jasmine.createSpyObj('Element', ['setAttribute']);
      LAYER_PREVIEW_DATA_HELPER.set(
          {isSelected: true, layerId, mode: LayerPreviewMode.NORMAL},
          mockElement,
          Mocks.object('instance'));
      assert(mockElement.setAttribute).to.haveBeenCalledWith('is-selected', 'true');
      assert(mockElement.setAttribute).to.haveBeenCalledWith('layer-id', layerId);
    });
  });
});


describe('LAYER_PREVIEW_MODE_DATA_HELPER', () => {
  describe('create', () => {
    it('should create the correct element', () => {
      const mockInstance = jasmine.createSpyObj('Instance', ['addDisposable']);

      const disposable = Mocks.object('disposable');
      const mockListenableDom = jasmine.createSpyObj('ListenableDom', ['on']);
      mockListenableDom.on.and.returnValue(disposable);
      spyOn(ListenableDom, 'of').and.returnValue(mockListenableDom);

      const element = Mocks.object('element');
      const mockDocument = jasmine.createSpyObj('Document', ['createElement']);
      mockDocument.createElement.and.returnValue(element);

      assert(LAYER_PREVIEW_MODE_DATA_HELPER.create(mockDocument, mockInstance)).to.equal(element);
      assert(mockInstance.addDisposable).to.haveBeenCalledWith(mockListenableDom);
      assert(mockInstance.addDisposable).to.haveBeenCalledWith(disposable);
      assert(mockListenableDom.on).to.haveBeenCalledWith(
          DomEvent.CLICK,
          mockInstance.onLayerPreviewModeSelected_,
          mockInstance);
      assert(ListenableDom.of).to.haveBeenCalledWith(element);
      assert(mockDocument.createElement).to.haveBeenCalledWith('gs-menu-item');
    });
  });

  describe('get', () => {
    it('should return the correct preview mode', () => {
      const mode = LayerPreviewMode.FULL;
      const mockElement = jasmine.createSpyObj('Element', ['getAttribute']);
      mockElement.getAttribute.and.returnValue(EnumParser(LayerPreviewMode).stringify(mode));
      assert(LAYER_PREVIEW_MODE_DATA_HELPER.get(mockElement)).to.equal(mode);
      assert(mockElement.getAttribute).to.haveBeenCalledWith('gs-value');
    });
  });

  describe('set', () => {
    it('should set the data correctly', () => {
      const mockElement = jasmine.createSpyObj('Element', ['setAttribute']);
      LAYER_PREVIEW_MODE_DATA_HELPER
          .set(LayerPreviewMode.BOUNDARY, mockElement, Mocks.object('instance'));
      assert(mockElement.setAttribute).to.haveBeenCalledWith('gs-content', 'boundary');
      assert(mockElement.setAttribute).to.haveBeenCalledWith('gs-value', 'boundary');
    });
  });
});


describe('asset.LayerView', () => {
  let mockAssetCollection;
  let mockOverlayService;
  let mockRenderService;
  let mockRouteFactoryService;
  let mockRouteService;
  let mockSampleDataService;
  let view: LayerView;

  beforeEach(() => {
    mockAssetCollection = jasmine.createSpyObj('AssetCollection', ['get', 'update']);
    mockOverlayService = jasmine.createSpyObj('OverlayService', ['hideOverlay']);
    mockRenderService = jasmine.createSpyObj('RenderService', ['render']);
    mockRouteFactoryService = jasmine.createSpyObj('RouteFactoryService', ['layer']);
    mockRouteService = jasmine.createSpyObj('RouteService', ['getParams', 'on']);
    mockSampleDataService = jasmine.createSpyObj('SampleDataService', ['getRowData']);
    view = new LayerView(
        mockAssetCollection,
        mockOverlayService,
        mockRenderService,
        mockRouteFactoryService,
        mockRouteService,
        mockSampleDataService,
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

      const mockAsset = jasmine.createSpyObj('Asset', ['getLayerIds', 'insertLayer']);
      mockAsset.getLayerIds.and.returnValue([oldId]);
      mockAssetCollection.get.and.returnValue(Promise.resolve(mockAsset));
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

      const id = 'id';
      spyOn(view['layerIdGenerator_'], 'generate').and.returnValue(id);

      const selectLayerSpy = spyOn(view, 'selectLayer_');
      const layerType = LayerType.HTML;

      await view['createLayer_'](layerType);
      assert(mockAssetCollection.update).to.haveBeenCalledWith(mockAsset);
      assert(mockOverlayService.hideOverlay).to.haveBeenCalledWith();

      assert(view['selectLayer_']).to.haveBeenCalledWith(Matchers.any(HtmlLayer));
      const layer: HtmlLayer = selectLayerSpy.calls.argsFor(0)[0];
      TestDispose.add(layer);

      assert(mockAsset.insertLayer).to.haveBeenCalledWith(layer);
      assert(layer.getName()).to.equal(Matchers.stringMatching(/New html layer/));
      assert(layer.getId()).to.equal(id);
      assert(view['layerIdGenerator_'].generate).to.haveBeenCalledWith([oldId]);
    });

    it('should reject the promise if the layer type is not supported', async (done: any) => {
      const layerRouteFactory = Mocks.object('layerRouteFactory');
      mockRouteFactoryService.layer.and.returnValue(layerRouteFactory);

      const mockAsset = jasmine.createSpyObj('Asset', ['getLayerIds', 'insertLayer']);
      mockAsset.getLayerIds.and.returnValue([]);
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

      const height = 123;
      const width = 456;
      const mockAsset = jasmine.createSpyObj('Asset', [
        'getData',
        'getHeight',
        'getId',
        'getLayers',
        'getProjectId',
        'getWidth',
      ]);
      mockAsset.getData.and.returnValue(mockDataSource);
      mockAsset.getHeight.and.returnValue(height);
      mockAsset.getId.and.returnValue(id);
      mockAsset.getProjectId.and.returnValue(projectId);
      mockAsset.getLayers.and.returnValue([mockLayer1, mockLayer2, mockLayer3]);
      mockAsset.getWidth.and.returnValue(width);

      spyOn(view.baseEditorAssetIdHook_, 'set');
      spyOn(view.baseEditorProjectIdHook_, 'set');
      spyOn(view.htmlEditorAssetIdHook_, 'set');
      spyOn(view.htmlEditorProjectIdHook_, 'set');
      spyOn(view.imageEditorAssetIdHook_, 'set');
      spyOn(view.imageEditorDataRowHook_, 'set');
      spyOn(view.imageEditorProjectIdHook_, 'set');
      spyOn(view.textEditorAssetIdHook_, 'set');
      spyOn(view.textEditorProjectIdHook_, 'set');
      spyOn(view.layersChildElementHook_, 'set');

      const style = Mocks.object('style');
      spyOn(view.layerPreviewsStyleHook_, 'get').and.returnValue(style);

      spyOn(view, 'updateLayerPreviews_');
      spyOn(view, 'selectDefaultLayer_');

      view['selectedLayerId_'] = layerId2;

      await view['onAssetChanged_'](mockAsset);
      assert(view['selectDefaultLayer_']).toNot.haveBeenCalled();
      assert(view.imageEditorDataRowHook_.set).to.haveBeenCalledWith(0);
      assert(style).to.equal({
        height: `${height}px`,
        width: `${width}px`,
      });
      assert(view.baseEditorAssetIdHook_.set).to.haveBeenCalledWith(id);
      assert(view.baseEditorProjectIdHook_.set).to.haveBeenCalledWith(projectId);
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

    it('should not throw error if the style object cannot be found', async (done: any) => {
      const id = 'id';
      const projectId = 'projectId';
      const mockDataSource = jasmine.createSpyObj('DataSource', ['getData']);
      mockDataSource.getData.and.returnValue(Promise.resolve(['data']));

      const mockAsset = jasmine.createSpyObj('Asset', [
        'getData',
        'getId',
        'getLayers',
        'getProjectId',
      ]);
      mockAsset.getData.and.returnValue(mockDataSource);
      mockAsset.getId.and.returnValue(id);
      mockAsset.getProjectId.and.returnValue(projectId);
      mockAsset.getLayers.and.returnValue([]);

      spyOn(view.baseEditorAssetIdHook_, 'set');
      spyOn(view.baseEditorProjectIdHook_, 'set');
      spyOn(view.htmlEditorAssetIdHook_, 'set');
      spyOn(view.htmlEditorProjectIdHook_, 'set');
      spyOn(view.imageEditorAssetIdHook_, 'set');
      spyOn(view.imageEditorDataRowHook_, 'set');
      spyOn(view.imageEditorProjectIdHook_, 'set');
      spyOn(view.textEditorAssetIdHook_, 'set');
      spyOn(view.textEditorProjectIdHook_, 'set');
      spyOn(view.layersChildElementHook_, 'set');

      spyOn(view.layerPreviewsStyleHook_, 'get').and.returnValue(null);

      spyOn(view, 'updateLayerPreviews_');
      spyOn(view, 'selectDefaultLayer_');

      await view['onAssetChanged_'](mockAsset);
    });

    it('should select the default layer if the selected layer cannot be found',
        async (done: any) => {
          const id = 'id';
          const projectId = 'projectId';
          const mockDataSource = jasmine.createSpyObj('DataSource', ['getData']);
          mockDataSource.getData.and.returnValue(Promise.resolve(['data']));

          const layerId = 'layerId';
          const mockLayer = jasmine.createSpyObj('Layer1', ['getId']);
          mockLayer.getId.and.returnValue(layerId);

          const mockAsset = jasmine.createSpyObj('Asset', [
            'getData',
            'getId',
            'getLayers',
            'getProjectId',
          ]);
          mockAsset.getData.and.returnValue(mockDataSource);
          mockAsset.getId.and.returnValue(id);
          mockAsset.getProjectId.and.returnValue(projectId);
          mockAsset.getLayers.and.returnValue([mockLayer]);

          spyOn(view.baseEditorAssetIdHook_, 'set');
          spyOn(view.baseEditorProjectIdHook_, 'set');
          spyOn(view.htmlEditorAssetIdHook_, 'set');
          spyOn(view.htmlEditorProjectIdHook_, 'set');
          spyOn(view.imageEditorAssetIdHook_, 'set');
          spyOn(view.imageEditorDataRowHook_, 'set');
          spyOn(view.imageEditorProjectIdHook_, 'set');
          spyOn(view.textEditorAssetIdHook_, 'set');
          spyOn(view.textEditorProjectIdHook_, 'set');
          spyOn(view.layersChildElementHook_, 'set');

          spyOn(view.layerPreviewsStyleHook_, 'get').and.returnValue(null);

          spyOn(view, 'updateLayerPreviews_');
          spyOn(view, 'selectDefaultLayer_');

          view['selectedLayerId_'] = 'otherLayerId';

          await view['onAssetChanged_'](mockAsset);
          assert(view['selectDefaultLayer_']).to.haveBeenCalledWith(mockAsset);
        });

    it('should not set the data row if the data length is 0', async (done: any) => {
      const mockDataSource = jasmine.createSpyObj('DataSource', ['getData']);
      mockDataSource.getData.and.returnValue(Promise.resolve([]));
      const mockAsset = jasmine.createSpyObj('Asset', ['getData', 'getId', 'getProjectId']);
      mockAsset.getData.and.returnValue(mockDataSource);
      mockAsset.getId.and.returnValue('id');
      mockAsset.getProjectId.and.returnValue('projectId');

      spyOn(view.baseEditorAssetIdHook_, 'set');
      spyOn(view.baseEditorProjectIdHook_, 'set');
      spyOn(view.htmlEditorAssetIdHook_, 'set');
      spyOn(view.htmlEditorProjectIdHook_, 'set');
      spyOn(view.imageEditorAssetIdHook_, 'set');
      spyOn(view.imageEditorDataRowHook_, 'set');
      spyOn(view.imageEditorProjectIdHook_, 'set');
      spyOn(view.textEditorAssetIdHook_, 'set');
      spyOn(view.textEditorProjectIdHook_, 'set');

      await view['onAssetChanged_'](mockAsset);
      assert(view.imageEditorDataRowHook_.set).toNot.haveBeenCalled();
    });

    it('should not set the data row if there are no data source', async (done: any) => {
      const mockAsset = jasmine.createSpyObj('Asset', ['getData', 'getId', 'getProjectId']);
      mockAsset.getData.and.returnValue(null);
      mockAsset.getId.and.returnValue('id');
      mockAsset.getProjectId.and.returnValue('projectId');

      spyOn(view.baseEditorAssetIdHook_, 'set');
      spyOn(view.baseEditorProjectIdHook_, 'set');
      spyOn(view.htmlEditorAssetIdHook_, 'set');
      spyOn(view.htmlEditorProjectIdHook_, 'set');
      spyOn(view.imageEditorAssetIdHook_, 'set');
      spyOn(view.imageEditorDataRowHook_, 'set');
      spyOn(view.imageEditorProjectIdHook_, 'set');
      spyOn(view.textEditorAssetIdHook_, 'set');
      spyOn(view.textEditorProjectIdHook_, 'set');

      await view['onAssetChanged_'](mockAsset);
      assert(view.imageEditorDataRowHook_.set).toNot.haveBeenCalled();
    });
  });

  describe('onCreated', () => {
    it('should listen to route changed event', () => {
      const element = Mocks.object('element');
      mockRouteService.on.and.returnValue({dispose(): void {}});
      spyOn(view, 'onRouteChanged_');
      spyOn(view, 'onSelectedLayerPreviewModeChanged_');
      view.onCreated(element);
      assert(view['onRouteChanged_']).to.haveBeenCalledWith();
      assert(mockRouteService.on).to
          .haveBeenCalledWith(RouteServiceEvents.CHANGED, view['onRouteChanged_'], view);
      assert(view['onSelectedLayerPreviewModeChanged_']).to.haveBeenCalledWith();
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

      spyOn(view.layerNameHook_, 'set');
      spyOn(view.layerTypeSwitchHook_, 'set');
      spyOn(view.baseEditorLayerIdHook_, 'set');
      spyOn(view.htmlEditorLayerIdHook_, 'set');
      spyOn(view.imageEditorLayerIdHook_, 'set');
      spyOn(view.textEditorLayerIdHook_, 'set');

      view['onLayerChanged_'](mockLayer);
      assert(view.layerNameHook_.set).to.haveBeenCalledWith(name);
      assert(view.layerTypeSwitchHook_.set).to.haveBeenCalledWith(type);
      assert(view.baseEditorLayerIdHook_.set).to.haveBeenCalledWith(id);
      assert(view.htmlEditorLayerIdHook_.set).to.haveBeenCalledWith(id);
      assert(view.imageEditorLayerIdHook_.set).to.haveBeenCalledWith(id);
      assert(view.textEditorLayerIdHook_.set).to.haveBeenCalledWith(id);
    });
  });

  describe('onLayerItemClick_', () => {
    it('should select the layer correctly and hide the overlay', async (done: any) => {
      const layerId = 'layerId';
      const mockLayer = jasmine.createSpyObj('Layer', ['getId']);
      mockLayer.getId.and.returnValue(layerId);

      const mockAsset = jasmine.createSpyObj('Asset', ['getLayers']);
      mockAsset.getLayers.and.returnValue([
        jasmine.createSpyObj('layer1', ['getId']),
        mockLayer,
        jasmine.createSpyObj('layer2', ['getId']),
      ]);
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

      spyOn(view, 'selectLayer_');

      await view['onLayerItemClick_'](layerId);
      assert(view['selectLayer_']).to.haveBeenCalledWith(mockLayer);
      assert(mockOverlayService.hideOverlay).to.haveBeenCalledWith();
    });

    it('should not select any layers if the layer cannot be found', async (done: any) => {
      const mockAsset = jasmine.createSpyObj('Asset', ['getLayers']);
      mockAsset.getLayers.and.returnValue([
        jasmine.createSpyObj('layer1', ['getId']),
        jasmine.createSpyObj('layer2', ['getId']),
      ]);
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

      spyOn(view, 'selectLayer_');

      await view['onLayerItemClick_']('layerId');
      assert(view['selectLayer_']).toNot.haveBeenCalled();
      assert(mockOverlayService.hideOverlay).to.haveBeenCalledWith();
    });

    it('should not select any layers if the asset cannot be found', async (done: any) => {
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(null));

      spyOn(view, 'selectLayer_');

      await view['onLayerItemClick_']('layerId');
      assert(view['selectLayer_']).toNot.haveBeenCalled();
      assert(mockOverlayService.hideOverlay).to.haveBeenCalledWith();
    });

    it('should not select any layers if the layerId is null', async (done: any) => {
      spyOn(view, 'selectLayer_');

      await view['onLayerItemClick_'](null);
      assert(view['selectLayer_']).toNot.haveBeenCalled();
      assert(mockOverlayService.hideOverlay).to.haveBeenCalledWith();
    });
  });

  describe('onLayerPreviewModeSelected_', () => {
    it('should update the selected layer correctly', () => {
      const previewMode = LayerPreviewMode.FULL;
      const mockTarget = jasmine.createSpyObj('Target', ['getAttribute']);
      mockTarget.getAttribute.and.returnValue('full');
      const event = Mocks.object('event');
      event.target = mockTarget;

      spyOn(view, 'selectedLayerPreviewMode_');
      spyOn(view, 'onSelectedLayerPreviewModeChanged_');
      spyOn(view, 'updateLayerPreviews_');

      view.onLayerPreviewModeSelected_(event);
      assert(mockOverlayService.hideOverlay).to.haveBeenCalledWith();
      assert(view['updateLayerPreviews_']).to.haveBeenCalledWith();
      assert(view['onSelectedLayerPreviewModeChanged_']).to.haveBeenCalledWith();
      assert(view['selectedLayerPreviewMode_']).to.equal(previewMode);
      assert(mockTarget.getAttribute).to.haveBeenCalledWith('gs-value');
    });

    it('should do nothing if the selected value is invalid', () => {
      const mockTarget = jasmine.createSpyObj('Target', ['getAttribute']);
      mockTarget.getAttribute.and.returnValue('unknown');
      const event = Mocks.object('event');
      event.target = mockTarget;

      spyOn(view, 'selectedLayerPreviewMode_');
      spyOn(view, 'onSelectedLayerPreviewModeChanged_');
      spyOn(view, 'updateLayerPreviews_');

      view.onLayerPreviewModeSelected_(event);
      assert(mockOverlayService.hideOverlay).toNot.haveBeenCalled();
      assert(view['updateLayerPreviews_']).toNot.haveBeenCalled();
      assert(view['onSelectedLayerPreviewModeChanged_']).toNot.haveBeenCalled();
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

  describe('onSelectedLayerPreviewModeChanged_', () => {
    it('should update the selected preview name and preview mode list correctly', () => {
      view['selectedLayerPreviewMode_'] = LayerPreviewMode.BOUNDARY;

      spyOn(view.selectedPreviewModeHook_, 'set');
      spyOn(view.previewModeChildElementHook_, 'set');

      view['onSelectedLayerPreviewModeChanged_']();

      assert(view.selectedPreviewModeHook_.set).to.haveBeenCalledWith('boundary');
      assert(view.previewModeChildElementHook_.set).to.haveBeenCalledWith([
        LayerPreviewMode.BOUNDARY,
        LayerPreviewMode.NORMAL,
        LayerPreviewMode.FULL,
        LayerPreviewMode.RENDER,
      ]);
    });
  });

  describe('selectDefaultLayer_', () => {
    it('should select the first layer', () => {
      const layer = Mocks.object('layer');
      const mockAsset = jasmine.createSpyObj('Asset', ['getLayers']);
      mockAsset.getLayers.and.returnValue([
        layer,
        Mocks.object('layer2'),
      ]);

      spyOn(view, 'createLayer_');
      spyOn(view, 'selectLayer_');

      view['selectDefaultLayer_'](mockAsset);
      assert(view['createLayer_']).toNot.haveBeenCalled();
      assert(view['selectLayer_']).to.haveBeenCalledWith(layer);
    });

    it('should create a new layer if there are no layers in the asset', () => {
      const mockAsset = jasmine.createSpyObj('Asset', ['getLayers']);
      mockAsset.getLayers.and.returnValue([]);

      spyOn(view, 'createLayer_');
      spyOn(view, 'selectLayer_');

      view['selectDefaultLayer_'](mockAsset);
      assert(view['createLayer_']).to.haveBeenCalledWith(LayerType.IMAGE);
      assert(view['selectLayer_']).toNot.haveBeenCalled();
    });
  });

  describe('selectLayer_', () => {
    it('should listen to layer changed event and deregister the previous one', () => {
      const mockOldDeregister = jasmine.createSpyObj('OldDeregister', ['dispose']);
      view['layerChangedDeregister_'] = mockOldDeregister;

      const mockDeregister = jasmine.createSpyObj('Deregister', ['dispose']);
      const layerId = 'layerId';
      const mockLayer = jasmine.createSpyObj('Layer', ['getId', 'on']);
      mockLayer.getId.and.returnValue(layerId);
      mockLayer.on.and.returnValue(mockDeregister);

      const spyOnLayerChanged = spyOn(view, 'onLayerChanged_');
      spyOn(view, 'updateLayerPreviews_');

      view['selectLayer_'](mockLayer);

      assert(view['updateLayerPreviews_']).to.haveBeenCalledWith();
      assert(view['onLayerChanged_']).to.haveBeenCalledWith(mockLayer);
      assert(view['selectedLayerId_']).to.equal(layerId);
      assert(mockLayer.on).to.haveBeenCalledWith(DataEvents.CHANGED, Matchers.any(Function), view);
      spyOnLayerChanged.calls.reset();

      mockLayer.on.calls.argsFor(0)[1]();
      assert(view['onLayerChanged_']).to.haveBeenCalledWith(mockLayer);
      assert(view['layerChangedDeregister_']).to.equal(mockDeregister);
    });

    it('should not throw error if there are no previous layer changed deregisters', () => {
      view['layerChangedDeregister_'] = null;

      const mockDeregister = jasmine.createSpyObj('Deregister', ['dispose']);
      const mockLayer = jasmine.createSpyObj('Layer', ['getId', 'on']);
      mockLayer.getId.and.returnValue('layerId');
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
      spyOn(view.layerPreviewsChildElementHook_, 'set');
      spyOn(view.previewSwitchHook_, 'set');

      view['selectedLayerId_'] = layerId1;
      view['selectedLayerPreviewMode_'] = LayerPreviewMode.NORMAL;
      await view.updateLayerPreviews_();
      assert(view.layerPreviewsChildElementHook_.set).to.haveBeenCalledWith([
        {isSelected: false, layerId: layerId2, mode: LayerPreviewMode.NORMAL},
        {isSelected: true, layerId: layerId1, mode: LayerPreviewMode.NORMAL},
      ]);
      assert(view.previewSwitchHook_.set).to.haveBeenCalledWith(false);
    });

    it('should update the image render if render was selected', async (done: any) => {
      const uri = 'uri';
      mockRenderService.render.and.returnValue(uri);
      spyOn(view.imageRenderSrcHook_, 'set');

      const asset = Mocks.object('asset');
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(asset));

      const sampleData = Mocks.object('sampleData');
      mockSampleDataService.getRowData.and.returnValue(Promise.resolve(sampleData));
      spyOn(view.previewSwitchHook_, 'set');

      view['selectedLayerPreviewMode_'] = LayerPreviewMode.RENDER;
      await view.updateLayerPreviews_();
      assert(view.imageRenderSrcHook_.set).to.haveBeenCalledWith(uri);
      assert(mockRenderService.render).to.haveBeenCalledWith(asset, sampleData);
      assert(view.previewSwitchHook_.set).to.haveBeenCalledWith(true);
    });

    it('should do nothing if asset cannot be found', async (done: any) => {
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(null));
      spyOn(view.layerPreviewsChildElementHook_, 'set');

      await view.updateLayerPreviews_();
      assert(view.layerPreviewsChildElementHook_.set).toNot.haveBeenCalled();
    });
  });
});
