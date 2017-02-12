import {assert, TestBase} from '../test-base';
TestBase.setup();

import {Mocks} from 'external/gs_tools/src/mock';
import {TestDispose} from 'external/gs_tools/src/testing';

import {RouteServiceEvents} from 'external/gs_ui/src/routing';

import {LayerPreview} from './layer-preview';


describe('asset.LayerPreview', () => {
  let mockAssetCollection;
  let mockRouteFactoryService;
  let mockRouteService;
  let mockSampleDataService;
  let mockTemplateCompilerService;
  let preview: LayerPreview;

  beforeEach(() => {
    mockAssetCollection = jasmine.createSpyObj('AssetCollection', ['get']);
    mockRouteFactoryService = jasmine.createSpyObj('RouteFactoryService', ['layer']);
    mockRouteService = jasmine.createSpyObj('RouteService', ['getParams', 'on']);
    mockSampleDataService = jasmine.createSpyObj('SampleDataService', ['getRowData']);
    mockTemplateCompilerService = jasmine.createSpyObj('TemplateCompilerService', ['create']);
    preview = new LayerPreview(
        mockAssetCollection,
        mockRouteFactoryService,
        mockRouteService,
        mockSampleDataService,
        mockTemplateCompilerService,
        jasmine.createSpyObj('ThemeService', ['applyTheme']));
    TestDispose.add(preview);
  });

  describe('onCreated', () => {
    it('should listen to route changed events', () => {
      spyOn(preview, 'onLayerIdChanged_');

      const element = Mocks.object('element');
      preview.onCreated(element);
      assert(preview['onLayerIdChanged_']).to.haveBeenCalledWith();
      assert(mockRouteService.on).to.haveBeenCalledWith(
          RouteServiceEvents.CHANGED,
          preview['onLayerIdChanged_'],
          preview);
    });
  });

  describe('onLayerIdChanged_', () => {
    it('should update the css and root inner HTMLs correctly', async (done: any) => {
      const layerRouteFactory = Mocks.object('layerRouteFactory');
      mockRouteFactoryService.layer.and.returnValue(layerRouteFactory);

      const assetId = 'assetId';
      const projectId = 'projectId';
      mockRouteService.getParams.and.returnValue({assetId, projectId});

      const layerId = 'layerId';
      spyOn(preview['layerIdHook_'], 'get').and.returnValue(layerId);

      const css = 'css';
      const html = 'html';
      const mockLayer = jasmine.createSpyObj('Layer', ['asHtml', 'getId']);
      mockLayer.asHtml.and.returnValue({css, html});
      mockLayer.getId.and.returnValue(layerId);

      const mockAsset = jasmine.createSpyObj('Asset', ['getLayers']);
      mockAsset.getLayers.and.returnValue([mockLayer]);
      mockAssetCollection.get.and.returnValue(Promise.resolve(mockAsset));

      const rowData = Mocks.object('rowData');
      mockSampleDataService.getRowData.and.returnValue(Promise.resolve(rowData));

      const compiledCss = 'compiledCss';
      const compiledHtml = 'compiledHtml';
      const mockCompiler = jasmine.createSpyObj('Compiler', ['compile']);
      mockCompiler.compile.and.callFake((template: any) => {
        switch (template) {
          case css:
            return compiledCss;
          case html:
            return compiledHtml;
        }
      });
      mockTemplateCompilerService.create.and.returnValue(mockCompiler);

      spyOn(preview['rootInnerHtmlHook_'], 'set');
      spyOn(preview['cssInnerHtmlHook_'], 'set');

      await preview['onLayerIdChanged_']();

      assert(preview['rootInnerHtmlHook_'].set).to.haveBeenCalledWith(compiledHtml);
      assert(preview['cssInnerHtmlHook_'].set).to.haveBeenCalledWith(compiledCss);
      assert(mockCompiler.compile).to.haveBeenCalledWith(html);
      assert(mockCompiler.compile).to.haveBeenCalledWith(css);
      assert(mockTemplateCompilerService.create).to.haveBeenCalledWith(mockAsset, rowData);
      assert(mockAssetCollection.get).to.haveBeenCalledWith(projectId, assetId);
      assert(mockRouteService.getParams).to.haveBeenCalledWith(layerRouteFactory);
    });

    it('should do nothing if no row data can be found', async (done: any) => {
      const layerRouteFactory = Mocks.object('layerRouteFactory');
      mockRouteFactoryService.layer.and.returnValue(layerRouteFactory);

      const assetId = 'assetId';
      const projectId = 'projectId';
      mockRouteService.getParams.and.returnValue({assetId, projectId});

      const layerId = 'layerId';
      spyOn(preview['layerIdHook_'], 'get').and.returnValue(layerId);

      const mockLayer = jasmine.createSpyObj('Layer', ['asHtml', 'getId']);
      mockLayer.getId.and.returnValue(layerId);

      const mockAsset = jasmine.createSpyObj('Asset', ['getLayers']);
      mockAsset.getLayers.and.returnValue([mockLayer]);
      mockAssetCollection.get.and.returnValue(Promise.resolve(mockAsset));

      mockSampleDataService.getRowData.and.returnValue(Promise.resolve(null));

      spyOn(preview['rootInnerHtmlHook_'], 'set');
      spyOn(preview['cssInnerHtmlHook_'], 'set');

      await preview['onLayerIdChanged_']();

      assert(preview['rootInnerHtmlHook_'].set).toNot.haveBeenCalled();
      assert(preview['cssInnerHtmlHook_'].set).toNot.haveBeenCalled();
    });

    it('should do nothing if layer cannot be found', async (done: any) => {
      const layerRouteFactory = Mocks.object('layerRouteFactory');
      mockRouteFactoryService.layer.and.returnValue(layerRouteFactory);

      const assetId = 'assetId';
      const projectId = 'projectId';
      mockRouteService.getParams.and.returnValue({assetId, projectId});

      spyOn(preview['layerIdHook_'], 'get').and.returnValue('layerId');

      const mockLayer = jasmine.createSpyObj('Layer', ['asHtml', 'getId']);
      mockLayer.getId.and.returnValue('otherLayerId');

      const mockAsset = jasmine.createSpyObj('Asset', ['getLayers']);
      mockAsset.getLayers.and.returnValue([mockLayer]);
      mockAssetCollection.get.and.returnValue(Promise.resolve(mockAsset));

      const rowData = Mocks.object('rowData');
      mockSampleDataService.getRowData.and.returnValue(Promise.resolve(rowData));

      spyOn(preview['rootInnerHtmlHook_'], 'set');
      spyOn(preview['cssInnerHtmlHook_'], 'set');

      await preview['onLayerIdChanged_']();

      assert(preview['rootInnerHtmlHook_'].set).toNot.haveBeenCalled();
      assert(preview['cssInnerHtmlHook_'].set).toNot.haveBeenCalled();
    });

    it('should do nothing if there is no asset', async (done: any) => {
      const layerRouteFactory = Mocks.object('layerRouteFactory');
      mockRouteFactoryService.layer.and.returnValue(layerRouteFactory);

      const assetId = 'assetId';
      const projectId = 'projectId';
      mockRouteService.getParams.and.returnValue({assetId, projectId});

      spyOn(preview['layerIdHook_'], 'get').and.returnValue('layerId');

      mockAssetCollection.get.and.returnValue(Promise.resolve(null));

      const rowData = Mocks.object('rowData');
      mockSampleDataService.getRowData.and.returnValue(Promise.resolve(rowData));

      spyOn(preview['rootInnerHtmlHook_'], 'set');
      spyOn(preview['cssInnerHtmlHook_'], 'set');

      await preview['onLayerIdChanged_']();

      assert(preview['rootInnerHtmlHook_'].set).toNot.haveBeenCalled();
      assert(preview['cssInnerHtmlHook_'].set).toNot.haveBeenCalled();
    });

    it('should do nothing if there is no data', async (done: any) => {
      const layerRouteFactory = Mocks.object('layerRouteFactory');
      mockRouteFactoryService.layer.and.returnValue(layerRouteFactory);

      const assetId = 'assetId';
      const projectId = 'projectId';
      mockRouteService.getParams.and.returnValue({assetId, projectId});

      const layerId = 'layerId';
      spyOn(preview['layerIdHook_'], 'get').and.returnValue(layerId);

      const mockLayer = jasmine.createSpyObj('Layer', ['asHtml', 'getId']);
      mockLayer.getId.and.returnValue(layerId);

      const mockAsset = jasmine.createSpyObj('Asset', ['getLayers']);
      mockAsset.getLayers.and.returnValue([mockLayer]);
      mockAssetCollection.get.and.returnValue(Promise.resolve(mockAsset));

      mockSampleDataService.getRowData.and.returnValue(Promise.resolve(null));

      spyOn(preview['rootInnerHtmlHook_'], 'set');
      spyOn(preview['cssInnerHtmlHook_'], 'set');

      await preview['onLayerIdChanged_']();

      assert(preview['rootInnerHtmlHook_'].set).toNot.haveBeenCalled();
      assert(preview['cssInnerHtmlHook_'].set).toNot.haveBeenCalled();
    });

    it('should do nothing if there is no layer ID', async (done: any) => {
      const layerRouteFactory = Mocks.object('layerRouteFactory');
      mockRouteFactoryService.layer.and.returnValue(layerRouteFactory);

      const assetId = 'assetId';
      const projectId = 'projectId';
      mockRouteService.getParams.and.returnValue({assetId, projectId});

      spyOn(preview['layerIdHook_'], 'get').and.returnValue(null);

      spyOn(preview['rootInnerHtmlHook_'], 'set');
      spyOn(preview['cssInnerHtmlHook_'], 'set');

      await preview['onLayerIdChanged_']();

      assert(preview['rootInnerHtmlHook_'].set).toNot.haveBeenCalled();
      assert(preview['cssInnerHtmlHook_'].set).toNot.haveBeenCalled();
    });

    it('should do nothing if there are no params', async (done: any) => {
      const layerRouteFactory = Mocks.object('layerRouteFactory');
      mockRouteFactoryService.layer.and.returnValue(layerRouteFactory);

      mockRouteService.getParams.and.returnValue(null);

      spyOn(preview['rootInnerHtmlHook_'], 'set');
      spyOn(preview['cssInnerHtmlHook_'], 'set');

      await preview['onLayerIdChanged_']();

      assert(preview['rootInnerHtmlHook_'].set).toNot.haveBeenCalled();
      assert(preview['cssInnerHtmlHook_'].set).toNot.haveBeenCalled();
    });
  });
});

