import { assert, TestBase } from '../test-base';
TestBase.setup();

import { Mocks } from 'external/gs_tools/src/mock';
import { TestDispose } from 'external/gs_tools/src/testing';

import { renderItemDataSetter, renderItemGenerator, RenderView } from '../asset/render-view';


describe('renderItemDataSetter', () => {
  it('should assign the data correctly', () => {
    const mockElement = jasmine.createSpyObj('Element', ['setAttribute']);
    const assetId = 'assetId';
    const filename = 'filename';
    const projectId = 'projectId';
    const key = 'key';
    const row = 123;
    const renderData = {assetId, filename, projectId, key, row};
    renderItemDataSetter(renderData, mockElement);
    assert(mockElement.setAttribute).to.haveBeenCalledWith('asset-id', assetId);
    assert(mockElement.setAttribute).to.haveBeenCalledWith('file-name', filename);
    assert(mockElement.setAttribute).to.haveBeenCalledWith('project-id', projectId);
    assert(mockElement.setAttribute).to.haveBeenCalledWith('render-key', key);
    assert(mockElement.setAttribute).to.haveBeenCalledWith('render-row', `${row}`);
  });
});


describe('renderItemGenerator', () => {
  it('should create the correct element', () => {
    const element = Mocks.object('element');
    const mockDocument = jasmine.createSpyObj('Document', ['createElement']);
    mockDocument.createElement.and.returnValue(element);
    assert(renderItemGenerator(mockDocument)).to.equal(element);
    assert(mockDocument.createElement).to.haveBeenCalledWith('pa-asset-render-item');
  });
});


describe('asset.RenderView', () => {
  let mockAssetCollection;
  let mockRouteFactoryService;
  let mockRouteService;
  let mockTemplateCompilerService;
  let view: RenderView;

  beforeEach(() => {
    mockAssetCollection = jasmine.createSpyObj('AssetCollection', ['get']);
    mockRouteFactoryService = jasmine.createSpyObj('RouteFactoryService', ['render']);
    mockRouteService = jasmine.createSpyObj('RouteService', ['getParams']);
    mockTemplateCompilerService = jasmine.createSpyObj('TemplateCompilerService', ['create']);
    view = new RenderView(
        mockAssetCollection,
        mockRouteFactoryService,
        mockRouteService,
        mockTemplateCompilerService,
        Mocks.object('ThemeService'));
    TestDispose.add(view);
  });

  describe('onRenderButtonClick_', () => {
    it('should update the render items correctly', async (done: any) => {
      const renderRouteFactory = Mocks.object('renderRouteFactory');
      mockRouteFactoryService.render.and.returnValue(renderRouteFactory);

      const assetId = 'assetId';
      const projectId = 'projectId';
      mockRouteService.getParams.and.returnValue({assetId, projectId});

      const key1 = 'key1';
      const key2 = 'key2';
      spyOn(view['renderIdGenerator_'], 'generate').and.returnValues(key1, key2);

      const value1 = Mocks.object('value1');
      const value2 = Mocks.object('value2');
      const mockDataSource = jasmine.createSpyObj('DataSource', ['getData']);
      mockDataSource.getData.and.returnValue(Promise.resolve([value1, value2]));

      const mockAsset = jasmine.createSpyObj('Asset', ['getData']);
      mockAsset.getData.and.returnValue(mockDataSource);
      mockAssetCollection.get.and.returnValue(Promise.resolve(mockAsset));

      const filenameTemplate = 'filenameTemplate';
      spyOn(view.filenameInputHook_, 'get').and.returnValue(filenameTemplate);

      const filename1 = 'filename1';
      const mockCompiler1 = jasmine.createSpyObj('Compiler1', ['compile']);
      mockCompiler1.compile.and.returnValue(filename1);

      const filename2 = 'filename2';
      const mockCompiler2 = jasmine.createSpyObj('Compiler2', ['compile']);
      mockCompiler2.compile.and.returnValue(filename2);

      mockTemplateCompilerService.create.and.callFake((asset: any, value: any) => {
        switch (value) {
          case value1:
            return mockCompiler1;
          case value2:
            return mockCompiler2;
        }
      });
      spyOn(view.rendersChildrenHook_, 'set');

      await view.onRenderButtonClick_();
      assert(view.rendersChildrenHook_.set).to.haveBeenCalledWith([
        {assetId, filename: filename1, key: key1, projectId, row: 0},
        {assetId, filename: filename2, key: key2, projectId, row: 1},
      ]);
      assert(view['expectedRenderKeys_']).to.haveElements([key1, key2]);
      assert(mockCompiler1.compile).to.haveBeenCalledWith(filenameTemplate);
      assert(mockCompiler2.compile).to.haveBeenCalledWith(filenameTemplate);
      assert(mockTemplateCompilerService.create).to.haveBeenCalledWith(mockAsset, value1);
      assert(mockTemplateCompilerService.create).to.haveBeenCalledWith(mockAsset, value2);
      assert(mockAssetCollection.get).to.haveBeenCalledWith(projectId, assetId);
      assert(mockRouteService.getParams).to.haveBeenCalledWith(renderRouteFactory);
    });

    it('should do nothing if there are no filename templates', async (done: any) => {
      const renderRouteFactory = Mocks.object('renderRouteFactory');
      mockRouteFactoryService.render.and.returnValue(renderRouteFactory);

      const assetId = 'assetId';
      const projectId = 'projectId';
      mockRouteService.getParams.and.returnValue({assetId, projectId});

      const mockDataSource = jasmine.createSpyObj('DataSource', ['getData']);

      const mockAsset = jasmine.createSpyObj('Asset', ['getData']);
      mockAsset.getData.and.returnValue(mockDataSource);
      mockAssetCollection.get.and.returnValue(Promise.resolve(mockAsset));

      spyOn(view.filenameInputHook_, 'get').and.returnValue(null);

      spyOn(view.rendersChildrenHook_, 'set');

      await view.onRenderButtonClick_();
      assert(view.rendersChildrenHook_.set).toNot.haveBeenCalled();
      assert(view['expectedRenderKeys_']).to.haveElements([]);
    });

    it('should do nothing if there are no data source', async (done: any) => {
      const renderRouteFactory = Mocks.object('renderRouteFactory');
      mockRouteFactoryService.render.and.returnValue(renderRouteFactory);

      const assetId = 'assetId';
      const projectId = 'projectId';
      mockRouteService.getParams.and.returnValue({assetId, projectId});

      const mockAsset = jasmine.createSpyObj('Asset', ['getData']);
      mockAsset.getData.and.returnValue(null);
      mockAssetCollection.get.and.returnValue(Promise.resolve(mockAsset));

      spyOn(view.filenameInputHook_, 'get').and.returnValue(null);

      spyOn(view.rendersChildrenHook_, 'set');

      await view.onRenderButtonClick_();
      assert(view.rendersChildrenHook_.set).toNot.haveBeenCalled();
      assert(view['expectedRenderKeys_']).to.haveElements([]);
    });

    it('should do nothing if there are no assets', async (done: any) => {
      const renderRouteFactory = Mocks.object('renderRouteFactory');
      mockRouteFactoryService.render.and.returnValue(renderRouteFactory);

      const assetId = 'assetId';
      const projectId = 'projectId';
      mockRouteService.getParams.and.returnValue({assetId, projectId});

      mockAssetCollection.get.and.returnValue(Promise.resolve(null));

      spyOn(view.filenameInputHook_, 'get').and.returnValue(null);

      spyOn(view.rendersChildrenHook_, 'set');

      await view.onRenderButtonClick_();
      assert(view.rendersChildrenHook_.set).toNot.haveBeenCalled();
      assert(view['expectedRenderKeys_']).to.haveElements([]);
    });

    it('should do nothing if there are no asset IDs', async (done: any) => {
      const renderRouteFactory = Mocks.object('renderRouteFactory');
      mockRouteFactoryService.render.and.returnValue(renderRouteFactory);

      const projectId = 'projectId';
      mockRouteService.getParams.and.returnValue({assetId: null, projectId});

      mockAssetCollection.get.and.returnValue(Promise.resolve(null));

      spyOn(view.filenameInputHook_, 'get').and.returnValue(null);

      spyOn(view.rendersChildrenHook_, 'set');

      await view.onRenderButtonClick_();
      assert(view.rendersChildrenHook_.set).toNot.haveBeenCalled();
      assert(view['expectedRenderKeys_']).to.haveElements([]);
    });

    it('should do nothing if there are no project IDs', async (done: any) => {
      const renderRouteFactory = Mocks.object('renderRouteFactory');
      mockRouteFactoryService.render.and.returnValue(renderRouteFactory);

      const assetId = 'assetId';
      mockRouteService.getParams.and.returnValue({assetId, projectId: null});

      mockAssetCollection.get.and.returnValue(Promise.resolve(null));

      spyOn(view.filenameInputHook_, 'get').and.returnValue(null);

      spyOn(view.rendersChildrenHook_, 'set');

      await view.onRenderButtonClick_();
      assert(view.rendersChildrenHook_.set).toNot.haveBeenCalled();
      assert(view['expectedRenderKeys_']).to.haveElements([]);
    });

    it('should do nothing if the params cannot be found', async (done: any) => {
      const renderRouteFactory = Mocks.object('renderRouteFactory');
      mockRouteFactoryService.render.and.returnValue(renderRouteFactory);
      mockRouteService.getParams.and.returnValue(null);

      mockAssetCollection.get.and.returnValue(Promise.resolve(null));

      spyOn(view.filenameInputHook_, 'get').and.returnValue(null);

      spyOn(view.rendersChildrenHook_, 'set');

      await view.onRenderButtonClick_();
      assert(view.rendersChildrenHook_.set).toNot.haveBeenCalled();
      assert(view['expectedRenderKeys_']).to.haveElements([]);
    });
  });
});
