import { assert, Matchers, TestBase } from '../test-base';
TestBase.setup();

import { Fakes, Mocks } from 'external/gs_tools/src/mock';
import { TestDispose } from 'external/gs_tools/src/testing';

import { RouteServiceEvents } from 'external/gs_ui/src/routing';

import { SampleDataServiceEvent } from '../common/sample-data-service-event';
import { DataEvents } from '../data/data-events';
import { TextLayer } from '../data/text-layer';

import { LayerPreview } from './layer-preview';


describe('asset.LayerPreview', () => {
  let mockAssetCollection: any;
  let mockCssImportService: any;
  let mockRouteFactoryService: any;
  let mockRouteService: any;
  let mockSampleDataService: any;
  let mockTemplateCompilerService: any;
  let preview: LayerPreview;

  beforeEach(() => {
    mockAssetCollection = jasmine.createSpyObj('AssetCollection', ['get']);
    mockCssImportService = jasmine.createSpyObj('CssImportService', ['import']);
    mockRouteFactoryService = jasmine.createSpyObj('RouteFactoryService', ['layer']);
    mockRouteService = jasmine.createSpyObj('RouteService', ['getParams', 'on']);
    mockSampleDataService = jasmine.createSpyObj('SampleDataService', ['getRowData', 'on']);
    mockTemplateCompilerService = jasmine.createSpyObj('TemplateCompilerService', ['create']);
    preview = new LayerPreview(
        mockAssetCollection,
        mockCssImportService,
        mockRouteFactoryService,
        mockRouteService,
        mockSampleDataService,
        mockTemplateCompilerService,
        jasmine.createSpyObj('ThemeService', ['applyTheme']));
    TestDispose.add(preview);
  });

  describe('onCreated', () => {
    it('should initialize correctly', () => {
      spyOn(preview, 'onLayerIdChanged_');
      spyOn(preview, 'listenTo');
      spyOn(preview, 'addDisposable').and.callThrough();

      const mockDisposable = jasmine.createSpyObj('Disposable', ['dispose']);
      mockRouteService.on.and.returnValue(mockDisposable);

      const element = Mocks.object('element');
      preview.onCreated(element);
      assert(preview['onLayerIdChanged_']).to.haveBeenCalledWith();
      assert(preview.addDisposable).to.haveBeenCalledWith(mockDisposable);
      assert(mockRouteService.on).to.haveBeenCalledWith(
          RouteServiceEvents.CHANGED,
          preview['onLayerIdChanged_'],
          preview);
      assert(preview.listenTo).to.haveBeenCalledWith(
          mockSampleDataService,
          SampleDataServiceEvent.ROW_CHANGED,
          preview['onDataChanged_']);
    });
  });

  describe('onDataChanged_', () => {
    it('should call onLayerIdChanged_', () => {
      spyOn(preview, 'onLayerIdChanged_');
      preview['onDataChanged_']();
      assert(preview['onLayerIdChanged_']).to.haveBeenCalledWith();
    });
  });

  describe('onLayerChange_', () => {
    it('should update the css and root inner HTMLs correctly', () => {
      const previewMode = Mocks.object('previewMode');
      spyOn(preview.previewModeHook_, 'get').and.returnValue(previewMode);

      const isActive = true;
      spyOn(preview.isSelectedHook_, 'get').and.returnValue(isActive);

      const css = 'css';
      const html = 'html';
      const fontUrl = 'fontUrl';
      const mockLayer = jasmine.createSpyObj('Layer', ['asPreviewHtml', 'getFontUrl']);
      mockLayer.getFontUrl.and.returnValue(fontUrl);
      mockLayer.asPreviewHtml.and.returnValue({css, html});
      Object.setPrototypeOf(mockLayer, TextLayer.prototype);

      const asset = Mocks.object('asset');

      const rowData = Mocks.object('rowData');

      const compiledCss = 'compiledCss';
      const compiledHtml = 'compiledHtml';
      const mockCompiler = jasmine.createSpyObj('Compiler', ['compile']);
      Fakes.build(mockCompiler.compile)
          .when(css).return(compiledCss)
          .when(html).return(compiledHtml);
      mockTemplateCompilerService.create.and.returnValue(mockCompiler);

      spyOn(preview['rootInnerHtmlHook_'], 'set');
      spyOn(preview['cssInnerHtmlHook_'], 'set');

      preview['onLayerChange_'](asset, rowData, mockLayer);

      assert(mockCssImportService.import).to.haveBeenCalledWith(fontUrl);
      assert(preview['rootInnerHtmlHook_'].set).to.haveBeenCalledWith(compiledHtml);
      assert(preview['cssInnerHtmlHook_'].set).to.haveBeenCalledWith(compiledCss);
      assert(mockCompiler.compile).to.haveBeenCalledWith(html);
      assert(mockCompiler.compile).to.haveBeenCalledWith(css);
      assert(mockTemplateCompilerService.create).to.haveBeenCalledWith(asset, rowData);
      assert(mockLayer.asPreviewHtml).to.haveBeenCalledWith(previewMode, isActive);
    });

    it('should not import the CSS if there are no font URLs', () => {
      spyOn(preview.previewModeHook_, 'get').and.returnValue(Mocks.object('previewMode'));
      spyOn(preview.isSelectedHook_, 'get').and.returnValue(true);

      const css = 'css';
      const html = 'html';
      const mockLayer = jasmine.createSpyObj('Layer', ['asPreviewHtml', 'getFontUrl']);
      mockLayer.getFontUrl.and.returnValue(null);
      mockLayer.asPreviewHtml.and.returnValue({css, html});
      Object.setPrototypeOf(mockLayer, TextLayer.prototype);

      const mockCompiler = jasmine.createSpyObj('Compiler', ['compile']);
      mockCompiler.compile.and.returnValue('compiled');
      mockTemplateCompilerService.create.and.returnValue(mockCompiler);

      spyOn(preview['rootInnerHtmlHook_'], 'set');
      spyOn(preview['cssInnerHtmlHook_'], 'set');

      preview['onLayerChange_'](Mocks.object('asset'), Mocks.object('rowData'), mockLayer);

      assert(mockCssImportService.import).toNot.haveBeenCalled();
    });

    it('should not import the CSS if the layer is not TextLayer', () => {
      spyOn(preview.previewModeHook_, 'get').and.returnValue(Mocks.object('previewMode'));
      spyOn(preview.isSelectedHook_, 'get').and.returnValue(true);

      const css = 'css';
      const html = 'html';
      const mockLayer = jasmine.createSpyObj('Layer', ['asPreviewHtml', 'getFontUrl']);
      mockLayer.getFontUrl.and.returnValue(null);
      mockLayer.asPreviewHtml.and.returnValue({css, html});

      const mockCompiler = jasmine.createSpyObj('Compiler', ['compile']);
      mockCompiler.compile.and.returnValue('compiled');
      mockTemplateCompilerService.create.and.returnValue(mockCompiler);

      spyOn(preview['rootInnerHtmlHook_'], 'set');
      spyOn(preview['cssInnerHtmlHook_'], 'set');

      preview['onLayerChange_'](Mocks.object('asset'), Mocks.object('rowData'), mockLayer);

      assert(mockCssImportService.import).toNot.haveBeenCalled();
    });

    it('should set the inner HTML hooks to empty string if compiler throws error', () => {
      const previewMode = Mocks.object('previewMode');
      spyOn(preview.previewModeHook_, 'get').and.returnValue(previewMode);

      const isActive = true;
      spyOn(preview.isSelectedHook_, 'get').and.returnValue(isActive);

      const fontUrl = 'fontUrl';
      const mockLayer = jasmine.createSpyObj('Layer', ['asPreviewHtml', 'getFontUrl']);
      mockLayer.getFontUrl.and.returnValue(fontUrl);
      mockLayer.asPreviewHtml.and.returnValue({css: 'css', html: 'html'});
      Object.setPrototypeOf(mockLayer, TextLayer.prototype);

      const asset = Mocks.object('asset');
      const rowData = Mocks.object('rowData');

      const mockCompiler = jasmine.createSpyObj('Compiler', ['compile']);
      mockCompiler.compile.and.throwError(new Error('Expected error'));
      mockTemplateCompilerService.create.and.returnValue(mockCompiler);

      spyOn(preview['rootInnerHtmlHook_'], 'set');
      spyOn(preview['cssInnerHtmlHook_'], 'set');

      preview['onLayerChange_'](asset, rowData, mockLayer);

      assert(mockCssImportService.import).to.haveBeenCalledWith(fontUrl);
      assert(preview['rootInnerHtmlHook_'].set).to.haveBeenCalledWith('');
      assert(preview['cssInnerHtmlHook_'].set).to.haveBeenCalledWith('');
      assert(mockTemplateCompilerService.create).to.haveBeenCalledWith(asset, rowData);
      assert(mockLayer.asPreviewHtml).to.haveBeenCalledWith(previewMode, isActive);
    });
  });

  describe('onDataChanged_', () => {
    it('should call onLayerIdChanged_', () => {
      spyOn(preview, 'onLayerIdChanged_');
      preview['onDataChanged_']();
      assert(preview.onLayerIdChanged_).to.haveBeenCalledWith();
    });
  });

  describe('onLayerIdChanged_', () => {
    it('should listen to layer change events', async () => {
      const layerRouteFactory = Mocks.object('layerRouteFactory');
      mockRouteFactoryService.layer.and.returnValue(layerRouteFactory);

      const assetId = 'assetId';
      const projectId = 'projectId';
      mockRouteService.getParams.and.returnValue({assetId, projectId});

      const layerId = 'layerId';
      spyOn(preview['layerIdHook_'], 'get').and.returnValue(layerId);

      const mockOldDeregister = jasmine.createSpyObj('OldDeregister', ['dispose']);
      preview['layerDeregister_'] = mockOldDeregister;

      const mockDeregister = jasmine.createSpyObj('Deregister', ['dispose']);
      const listenToSpy = spyOn(preview, 'listenTo').and.returnValue(mockDeregister);
      const mockLayer = jasmine.createSpyObj('Layer', ['getId']);
      mockLayer.getId.and.returnValue(layerId);

      const mockAsset = jasmine.createSpyObj('Asset', ['getLayers']);
      mockAsset.getLayers.and.returnValue([mockLayer]);
      mockAssetCollection.get.and.returnValue(Promise.resolve(mockAsset));

      const rowData = Mocks.object('rowData');
      mockSampleDataService.getRowData.and.returnValue(Promise.resolve(rowData));

      const spyLayerChange = spyOn(preview, 'onLayerChange_');

      await preview['onLayerIdChanged_']();

      assert(preview['onLayerChange_']).to.haveBeenCalledWith(mockAsset, rowData, mockLayer);
      assert(preview.listenTo).to.haveBeenCalledWith(
          mockLayer,
          DataEvents.CHANGED,
          Matchers.any(Function) as any);

      spyLayerChange.calls.reset();
      listenToSpy.calls.argsFor(0)[2]();
      assert(preview['onLayerChange_']).to.haveBeenCalledWith(mockAsset, rowData, mockLayer);
      assert(mockAssetCollection.get).to.haveBeenCalledWith(projectId, assetId);
      assert(mockRouteService.getParams).to.haveBeenCalledWith(layerRouteFactory);
      assert(preview['layerDeregister_']).to.equal(mockDeregister);
      assert(mockOldDeregister.dispose).to.haveBeenCalledWith();
    });

    it('should not throw error if there are no previous deregisters', async () => {
      const layerRouteFactory = Mocks.object('layerRouteFactory');
      mockRouteFactoryService.layer.and.returnValue(layerRouteFactory);

      mockRouteService.getParams.and.returnValue({assetId: 'assetId', projectId: 'projectId'});

      const layerId = 'layerId';
      spyOn(preview['layerIdHook_'], 'get').and.returnValue(layerId);

      const mockDeregister = jasmine.createSpyObj('Deregister', ['dispose']);
      const mockLayer = jasmine.createSpyObj('Layer', ['getId', 'on']);
      mockLayer.getId.and.returnValue(layerId);
      mockLayer.on.and.returnValue(mockDeregister);

      const mockAsset = jasmine.createSpyObj('Asset', ['getLayers']);
      mockAsset.getLayers.and.returnValue([mockLayer]);
      mockAssetCollection.get.and.returnValue(Promise.resolve(mockAsset));

      mockSampleDataService.getRowData.and.returnValue(Promise.resolve(Mocks.object('rowData')));

      spyOn(preview, 'onLayerChange_');

      await preview['onLayerIdChanged_']();
    });

    it('should do nothing if no row data can be found', async () => {
      const layerRouteFactory = Mocks.object('layerRouteFactory');
      mockRouteFactoryService.layer.and.returnValue(layerRouteFactory);

      const assetId = 'assetId';
      const projectId = 'projectId';
      mockRouteService.getParams.and.returnValue({assetId, projectId});

      const layerId = 'layerId';
      spyOn(preview['layerIdHook_'], 'get').and.returnValue(layerId);

      const mockDeregister = jasmine.createSpyObj('Deregister', ['dispose']);
      const mockLayer = jasmine.createSpyObj('Layer', ['getId', 'on']);
      mockLayer.getId.and.returnValue(layerId);
      mockLayer.on.and.returnValue(mockDeregister);

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

    it('should do nothing if layer cannot be found', async () => {
      const layerRouteFactory = Mocks.object('layerRouteFactory');
      mockRouteFactoryService.layer.and.returnValue(layerRouteFactory);

      const assetId = 'assetId';
      const projectId = 'projectId';
      mockRouteService.getParams.and.returnValue({assetId, projectId});

      spyOn(preview['layerIdHook_'], 'get').and.returnValue('layerId');


      const mockDeregister = jasmine.createSpyObj('Deregister', ['dispose']);
      const mockLayer = jasmine.createSpyObj('Layer', ['getId', 'on']);
      mockLayer.getId.and.returnValue('otherLayerId');
      mockLayer.on.and.returnValue(mockDeregister);

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

    it('should do nothing if there is no asset', async () => {
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

    it('should do nothing if there is no data', async () => {
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

    it('should do nothing if there is no layer ID', async () => {
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

    it('should do nothing if there are no params', async () => {
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

