import { assert, TestBase } from '../test-base';
TestBase.setup();

import { ListenableDom } from 'external/gs_tools/src/event';
import { Fakes, Mocks } from 'external/gs_tools/src/mock';
import { TestDispose } from 'external/gs_tools/src/testing';

import { RouteServiceEvents } from 'external/gs_ui/src/const';

import { RENDER_ITEM_DATA_HELPER, RenderView } from '../asset/render-view';
import { DataEvents } from '../data/data-events';


describe('RENDER_ITEM_DATA_HELPER', () => {
  describe('create', () => {
    it('should create the correct element', () => {
      const element = Mocks.object('element');
      const mockInstance = jasmine.createSpyObj('Instance', ['listenToRenderEvent']);
      const mockDocument = jasmine.createSpyObj('Document', ['createElement']);
      mockDocument.createElement.and.returnValue(element);
      assert(RENDER_ITEM_DATA_HELPER.create(mockDocument, mockInstance))
          .to.equal(element);
      assert(mockDocument.createElement).to.haveBeenCalledWith('pa-asset-render-item');
      assert(mockInstance.listenToRenderEvent).to.haveBeenCalledWith(element);
    });
  });

  describe('get', () => {
    it('should return the data correctly', () => {
      const assetId = 'assetId';
      const filename = 'filename';
      const projectId = 'projectId';
      const key = 'key';
      const row = 123;
      const mockElement = jasmine.createSpyObj('Element', ['getAttribute']);
      mockElement.getAttribute.and.callFake((attrName: string) => {
        switch (attrName) {
          case 'asset-id':
            return assetId;
          case 'file-name':
            return filename;
          case 'project-id':
            return projectId;
          case 'render-key':
            return key;
          case 'render-row':
            return `${row}`;
        }
      });

      assert(RENDER_ITEM_DATA_HELPER.get(mockElement)).to
          .equal({assetId, filename, projectId, key, row});
      assert(mockElement.getAttribute).to.haveBeenCalledWith('asset-id');
      assert(mockElement.getAttribute).to.haveBeenCalledWith('file-name');
      assert(mockElement.getAttribute).to.haveBeenCalledWith('project-id');
      assert(mockElement.getAttribute).to.haveBeenCalledWith('render-key');
      assert(mockElement.getAttribute).to.haveBeenCalledWith('render-row');
    });

    it('should return null if there are no asset IDs', () => {
      const mockElement = jasmine.createSpyObj('Element', ['getAttribute']);
      mockElement.getAttribute.and.callFake((attrName: string) => {
        switch (attrName) {
          case 'asset-id':
            return null;
          case 'file-name':
            return 'filename';
          case 'project-id':
            return 'projectId';
          case 'render-key':
            return 'key';
          case 'render-row':
            return `123`;
        }
      });

      assert(RENDER_ITEM_DATA_HELPER.get(mockElement)).to.beNull();
    });

    it('should return null if there are no file names', () => {
      const mockElement = jasmine.createSpyObj('Element', ['getAttribute']);
      mockElement.getAttribute.and.callFake((attrName: string) => {
        switch (attrName) {
          case 'asset-id':
            return 'assetId';
          case 'file-name':
            return null;
          case 'project-id':
            return 'projectId';
          case 'render-key':
            return 'key';
          case 'render-row':
            return `123`;
        }
      });

      assert(RENDER_ITEM_DATA_HELPER.get(mockElement)).to.beNull();
    });

    it('should return null if there are no project IDs', () => {
      const mockElement = jasmine.createSpyObj('Element', ['getAttribute']);
      mockElement.getAttribute.and.callFake((attrName: string) => {
        switch (attrName) {
          case 'asset-id':
            return 'assetId';
          case 'file-name':
            return 'filename';
          case 'project-id':
            return null;
          case 'render-key':
            return 'key';
          case 'render-row':
            return `123`;
        }
      });

      assert(RENDER_ITEM_DATA_HELPER.get(mockElement)).to.beNull();
    });

    it('should return null if there are no keys', () => {
      const mockElement = jasmine.createSpyObj('Element', ['getAttribute']);
      mockElement.getAttribute.and.callFake((attrName: string) => {
        switch (attrName) {
          case 'asset-id':
            return 'assetId';
          case 'file-name':
            return 'filename';
          case 'project-id':
            return 'projectId';
          case 'render-key':
            return null;
          case 'render-row':
            return `123`;
        }
      });

      assert(RENDER_ITEM_DATA_HELPER.get(mockElement)).to.beNull();
    });

    it('should return null if there are no rows', () => {
      const mockElement = jasmine.createSpyObj('Element', ['getAttribute']);
      mockElement.getAttribute.and.callFake((attrName: string) => {
        switch (attrName) {
          case 'asset-id':
            return 'assetId';
          case 'file-name':
            return 'filename';
          case 'project-id':
            return 'projectId';
          case 'render-key':
            return 'key';
          case 'render-row':
            return NaN;
        }
      });

      assert(RENDER_ITEM_DATA_HELPER.get(mockElement)).to.beNull();
    });
  });

  describe('set', () => {
    it('should assign the data correctly', () => {
      const mockElement = jasmine.createSpyObj('Element', ['setAttribute']);
      const assetId = 'assetId';
      const filename = 'filename';
      const projectId = 'projectId';
      const key = 'key';
      const row = 123;
      const renderData = {assetId, filename, projectId, key, row};
      RENDER_ITEM_DATA_HELPER.set(renderData, mockElement, Mocks.object('instance'));
      assert(mockElement.setAttribute).to.haveBeenCalledWith('asset-id', assetId);
      assert(mockElement.setAttribute).to.haveBeenCalledWith('file-name', filename);
      assert(mockElement.setAttribute).to.haveBeenCalledWith('project-id', projectId);
      assert(mockElement.setAttribute).to.haveBeenCalledWith('render-key', key);
      assert(mockElement.setAttribute).to.haveBeenCalledWith('render-row', `${row}`);
    });
  });
});


describe('asset.RenderView', () => {
  let mockAssetCollection: any;
  let mockDownloadService;
  let mockJsZipCtor: any;
  let mockRouteFactoryService: any;
  let mockRouteService: any;
  let mockTemplateCompilerService: any;
  let view: RenderView;

  beforeEach(() => {
    mockAssetCollection = jasmine.createSpyObj('AssetCollection', ['get', 'update']);
    mockDownloadService = jasmine.createSpyObj('DownloadService', ['download']);
    mockJsZipCtor = jasmine.createSpy('JsZipCtor');
    mockRouteFactoryService = jasmine.createSpyObj('RouteFactoryService', ['render']);
    mockRouteService = jasmine.createSpyObj('RouteService', ['getParams', 'on']);
    mockTemplateCompilerService = jasmine.createSpyObj('TemplateCompilerService', ['create']);
    view = new RenderView(
        mockAssetCollection,
        mockDownloadService,
        mockJsZipCtor,
        mockRouteFactoryService,
        mockRouteService,
        mockTemplateCompilerService,
       jasmine.createSpyObj('ThemeService', ['applyTheme']));
    TestDispose.add(view);
  });

  describe('disposeInternal', () => {
    it('should dispose the asset changed disposable', () => {
      const mockDeregister = jasmine.createSpyObj('Deregister', ['dispose']);
      view['assetChangedDeregister_'] = mockDeregister;
      view.disposeInternal();
      assert(mockDeregister.dispose).to.haveBeenCalledWith();
    });

    it('should not throw error if there are no asset changed disposables', () => {
      assert(() => {
        view.disposeInternal();
      }).toNot.throw();
    });
  });

  xdescribe('getAsset_', () => {
    it('should resolve with the correct asset', async () => {
      const asset = Mocks.object('asset');
      mockAssetCollection.get.and.returnValue(asset);

      const assetId = 'assetId';
      const projectId = 'projectId';
      mockRouteService.getParams.and.returnValue({assetId, projectId});

      const renderRouteFactory = Mocks.object('renderRouteFactory');
      mockRouteFactoryService.render.and.returnValue(renderRouteFactory);

      assert(await view['getAsset_']()).to.equal(asset);
      assert(mockAssetCollection.get).to.haveBeenCalledWith(projectId, assetId);
      assert(mockRouteService.getParams).to.haveBeenCalledWith(renderRouteFactory);
    });

    it('should resolve null if there are no asset IDs', async () => {
      const projectId = 'projectId';
      mockRouteService.getParams.and.returnValue({assetId: null, projectId});

      const renderRouteFactory = Mocks.object('renderRouteFactory');
      mockRouteFactoryService.render.and.returnValue(renderRouteFactory);

      assert(await view['getAsset_']()).to.beNull();
    });

    it('should resolve null if there are no project IDs', async () => {
      const assetId = 'assetId';
      mockRouteService.getParams.and.returnValue({assetId, projectId: null});

      const renderRouteFactory = Mocks.object('renderRouteFactory');
      mockRouteFactoryService.render.and.returnValue(renderRouteFactory);

      assert(await view['getAsset_']()).to.beNull();
    });

    it('should resolve null if there are no params', async () => {
      mockRouteService.getParams.and.returnValue(null);

      const renderRouteFactory = Mocks.object('renderRouteFactory');
      mockRouteFactoryService.render.and.returnValue(renderRouteFactory);

      assert(await view['getAsset_']()).to.beNull();
    });
  });

  describe('listenToRenderEvent', () => {
    it('should listen to the element correctly', () => {
      const mockListenableElement = jasmine.createSpyObj('ListenableElement', ['dispose']);
      spyOn(ListenableDom, 'of').and.returnValue(mockListenableElement);
      spyOn(view, 'listenTo');

      const element = Mocks.object('element');
      view.listenToRenderEvent(element);
      assert(view.listenTo).to.haveBeenCalledWith(
          mockListenableElement,
          'render',
          view['onRendered_']);
      assert(ListenableDom.of).to.haveBeenCalledWith(element);
    });
  });

  describe('onAssetChanged_', () => {
    it('should update the filename input correctly', async () => {
      const filename = 'filename';
      const mockAsset = jasmine.createSpyObj('Asset', ['getFilename']);
      mockAsset.getFilename.and.returnValue(filename);

      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));
      spyOn(view.filenameInputHook_, 'set');

      await view['onAssetChanged_']();
      assert(view.filenameInputHook_.set).to.haveBeenCalledWith(filename);
    });

    it('should do nothing if asset is null', async () => {
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(null));
      spyOn(view.filenameInputHook_, 'set');

      await view['onAssetChanged_']();
      assert(view.filenameInputHook_.set).toNot.haveBeenCalled();
    });
  });

  describe('onCreated', () => {
    it('should listen to route changed event', () => {
      const element = Mocks.object('element');
      spyOn(view, 'onRouteChanged_');
      spyOn(view, 'listenTo');
      spyOn(view.downloadButtonDisabledHook_, 'set');
      spyOn(view, 'addDisposable').and.callThrough();

      const mockDisposable = jasmine.createSpyObj('Disposable', ['dispose']);
      mockRouteService.on.and.returnValue(mockDisposable);

      view.onCreated(element);
      assert(mockRouteService.on).to.haveBeenCalledWith(
          RouteServiceEvents.CHANGED, view['onRouteChanged_'], view);
      assert(view.addDisposable).to.haveBeenCalledWith(mockDisposable);
      assert(view['onRouteChanged_']).to.haveBeenCalledWith();
      assert(view.downloadButtonDisabledHook_.set).to.haveBeenCalledWith(true);
    });
  });

  describe('onFilenameChanged_', () => {
    it('should update the asset correctly', async () => {
      const mockAsset = jasmine.createSpyObj('Asset', ['setFilename']);
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

      const filename = 'filename';
      spyOn(view.filenameInputHook_, 'get').and.returnValue(filename);

      await view['onFilenameChanged_']();
      assert(mockAssetCollection.update).to.haveBeenCalledWith(mockAsset);
      assert(mockAsset.setFilename).to.haveBeenCalledWith(filename);
    });

    it('should do nothing if filename is null', async () => {
      const mockAsset = jasmine.createSpyObj('Asset', ['setFilename']);
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

      spyOn(view.filenameInputHook_, 'get').and.returnValue(null);

      await view['onFilenameChanged_']();
      assert(mockAssetCollection.update).toNot.haveBeenCalled();
      assert(mockAsset.setFilename).toNot.haveBeenCalled();
    });

    it('should do nothing if asset is null', async () => {
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(null));

      await view['onFilenameChanged_']();
      assert(mockAssetCollection.update).toNot.haveBeenCalled();
    });
  });

  xdescribe('onRenderButtonClick_', () => {
    it('should update the render items correctly', async () => {
      const key1 = 'key1';
      const key2 = 'key2';
      spyOn(view['renderIdGenerator_'], 'generate').and.returnValues(key1, key2);

      const value1 = Mocks.object('value1');
      const value2 = Mocks.object('value2');
      const mockDataSource = jasmine.createSpyObj('DataSource', ['getData']);
      mockDataSource.getData.and.returnValue(Promise.resolve([value1, value2]));

      const assetId = 'assetId';
      const projectId = 'projectId';

      const mockAsset = jasmine.createSpyObj('Asset', ['getData', 'getId', 'getProjectId']);
      mockAsset.getData.and.returnValue(mockDataSource);
      mockAsset.getId.and.returnValue(assetId);
      mockAsset.getProjectId.and.returnValue(projectId);
      spyOn(view, 'getAsset_').and.returnValue(mockAsset);

      const filenameTemplate = 'filenameTemplate';
      spyOn(view.filenameInputHook_, 'get').and.returnValue(filenameTemplate);

      const filename1 = 'filename1';
      const mockCompiler1 = jasmine.createSpyObj('Compiler1', ['compile']);
      mockCompiler1.compile.and.returnValue(filename1);

      const filename2 = 'filename2';
      const mockCompiler2 = jasmine.createSpyObj('Compiler2', ['compile']);
      mockCompiler2.compile.and.returnValue(filename2);

      mockTemplateCompilerService.create.and.callFake((_: any, value: any) => {
        switch (value) {
          case value1:
            return mockCompiler1;
          case value2:
            return mockCompiler2;
        }
      });
      spyOn(view.rendersChildrenHook_, 'set');
      spyOn(view, 'updateRenderKey_');
      spyOn(view['fileData_'], 'clear');

      await view.onRenderButtonClick_();
      assert(view.rendersChildrenHook_.set).to.haveBeenCalledWith([
        {assetId, filename: filename1, key: key1, projectId, row: 0},
        {assetId, filename: filename2, key: key2, projectId, row: 1},
      ]);
      assert(view['updateRenderKey_']).to.haveBeenCalledWith();
      assert(view['expectedRenderKeys_']).to.haveElements([key1, key2]);
      assert(view['fileData_'].clear).to.haveBeenCalledWith();
      assert(mockCompiler1.compile).to.haveBeenCalledWith(filenameTemplate);
      assert(mockCompiler2.compile).to.haveBeenCalledWith(filenameTemplate);
      assert(mockTemplateCompilerService.create).to.haveBeenCalledWith(mockAsset, value1);
      assert(mockTemplateCompilerService.create).to.haveBeenCalledWith(mockAsset, value2);
      assert(view.rendersChildrenHook_.set).to.haveBeenCalledWith([]);
    });

    it('should do nothing if there are no filename templates', async () => {
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
      assert(view.rendersChildrenHook_.set).to.haveBeenCalledWith([]);
      assert(view['expectedRenderKeys_']).to.haveElements([]);
    });

    it('should do nothing if there are no data source', async () => {
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
      assert(view.rendersChildrenHook_.set).to.haveBeenCalledWith([]);
      assert(view['expectedRenderKeys_']).to.haveElements([]);
    });

    it('should do nothing if there are no assets', async () => {
      const renderRouteFactory = Mocks.object('renderRouteFactory');
      mockRouteFactoryService.render.and.returnValue(renderRouteFactory);

      const assetId = 'assetId';
      const projectId = 'projectId';
      mockRouteService.getParams.and.returnValue({assetId, projectId});

      mockAssetCollection.get.and.returnValue(Promise.resolve(null));

      spyOn(view.filenameInputHook_, 'get').and.returnValue(null);

      spyOn(view.rendersChildrenHook_, 'set');

      await view.onRenderButtonClick_();
      assert(view.rendersChildrenHook_.set).to.haveBeenCalledWith([]);
      assert(view['expectedRenderKeys_']).to.haveElements([]);
    });
  });

  describe('onRendered_', () => {
    it('should update the bookkeeping and the render key', () => {
      const dataUrl = 'dataUrl';
      const filename = 'filename';
      const renderKey = 'renderKey';
      const mockTarget = jasmine.createSpyObj('Target', ['getAttribute']);
      Fakes.build(mockTarget.getAttribute)
          .when('render-out').return(dataUrl)
          .when('render-key').return(renderKey)
          .when('file-name').return(filename);
      Object.setPrototypeOf(mockTarget, Element.prototype);
      view['expectedRenderKeys_'].add(renderKey);

      spyOn(view, 'updateRenderKey_');

      const event = Mocks.object('event');
      event.target = mockTarget;
      view['onRendered_'](event);
      assert(view['updateRenderKey_']).to.haveBeenCalledWith();
      assert(view['fileData_']).to.haveElements([{dataUrl, filename}]);
      assert(view['expectedRenderKeys_']).to.haveElements([]);
      assert(mockTarget.getAttribute).to.haveBeenCalledWith('file-name');
      assert(mockTarget.getAttribute).to.haveBeenCalledWith('render-out');
      assert(mockTarget.getAttribute).to.haveBeenCalledWith('render-key');
    });

    it('should do nothing if renderKey is null', () => {
      const dataUrl = 'dataUrl';
      const filename = 'filename';
      const renderKey = 'renderKey';
      const mockTarget = jasmine.createSpyObj('Target', ['getAttribute']);
      Fakes.build(mockTarget.getAttribute)
          .when('render-out').return(dataUrl)
          .when('render-key').return(null)
          .when('file-name').return(filename);
      Object.setPrototypeOf(mockTarget, Element.prototype);
      view['expectedRenderKeys_'].add(renderKey);

      spyOn(view, 'updateRenderKey_');

      const event = Mocks.object('event');
      event.target = mockTarget;
      view['onRendered_'](event);
      assert(view['updateRenderKey_']).toNot.haveBeenCalled();
      assert(view['fileData_']).to.haveElements([]);
      assert(view['expectedRenderKeys_']).to.haveElements([renderKey]);
    });

    it('should do nothing if dataUrl is null', () => {
      const filename = 'filename';
      const renderKey = 'renderKey';
      const mockTarget = jasmine.createSpyObj('Target', ['getAttribute']);
      Fakes.build(mockTarget.getAttribute)
          .when('render-out').return(null)
          .when('render-key').return(renderKey)
          .when('file-name').return(filename);
      Object.setPrototypeOf(mockTarget, Element.prototype);
      view['expectedRenderKeys_'].add(renderKey);

      spyOn(view, 'updateRenderKey_');

      const event = Mocks.object('event');
      event.target = mockTarget;
      view['onRendered_'](event);
      assert(view['updateRenderKey_']).toNot.haveBeenCalled();
      assert(view['fileData_']).to.haveElements([]);
      assert(view['expectedRenderKeys_']).to.haveElements([renderKey]);
    });

    it('should do nothing if filename is null', () => {
      const dataUrl = 'dataUrl';
      const renderKey = 'renderKey';
      const mockTarget = jasmine.createSpyObj('Target', ['getAttribute']);
      Fakes.build(mockTarget.getAttribute)
          .when('render-out').return(dataUrl)
          .when('render-key').return(renderKey)
          .when('file-name').return(null);
      Object.setPrototypeOf(mockTarget, Element.prototype);
      view['expectedRenderKeys_'].add(renderKey);

      spyOn(view, 'updateRenderKey_');

      const event = Mocks.object('event');
      event.target = mockTarget;
      view['onRendered_'](event);
      assert(view['updateRenderKey_']).toNot.haveBeenCalled();
      assert(view['fileData_']).to.haveElements([]);
      assert(view['expectedRenderKeys_']).to.haveElements([renderKey]);
    });

    it('should do nothing if target is not an element', () => {
      const renderKey = 'renderKey';
      const mockTarget = jasmine.createSpyObj('Target', ['getAttribute']);
      view['expectedRenderKeys_'].add(renderKey);

      spyOn(view, 'updateRenderKey_');

      const event = Mocks.object('event');
      event.target = mockTarget;
      view['onRendered_'](event);
      assert(view['updateRenderKey_']).toNot.haveBeenCalled();
      assert(view['fileData_']).to.haveElements([]);
      assert(view['expectedRenderKeys_']).to.haveElements([renderKey]);
    });
  });

  describe('onRouteChanged_', () => {
    it('should listen to asset changed event', async () => {
      const mockPreviousDeregister = jasmine.createSpyObj('PreviousDeregister', ['dispose']);
      view['assetChangedDeregister_'] = mockPreviousDeregister;

      const mockDeregister = jasmine.createSpyObj('Deregister', ['dispose']);
      const asset = Mocks.object('asset');
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(asset));
      spyOn(view, 'onAssetChanged_');
      spyOn(view, 'listenTo').and.returnValue(mockDeregister);

      await view['onRouteChanged_']();
      assert(view['onAssetChanged_']).to.haveBeenCalledWith();
      assert(view.listenTo).to
          .haveBeenCalledWith(asset, DataEvents.CHANGED, view['onAssetChanged_']);
      assert(view['assetChangedDeregister_']).to.equal(mockDeregister);
      assert(mockPreviousDeregister.dispose).to.haveBeenCalledWith();
    });

    it('should only dispose the previous deregister if asset is null', async () => {
      const mockPreviousDeregister = jasmine.createSpyObj('PreviousDeregister', ['dispose']);
      view['assetChangedDeregister_'] = mockPreviousDeregister;

      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(null));
      spyOn(view, 'onAssetChanged_');
      spyOn(view, 'listenTo').and.returnValue(jasmine.createSpyObj('Deregister', ['dispose']));

      await view['onRouteChanged_']();
      assert(view['onAssetChanged_']).toNot.haveBeenCalled();
      assert(view['assetChangedDeregister_']).to.beNull();
      assert(mockPreviousDeregister.dispose).to.haveBeenCalledWith();
    });
  });

  describe('updateRenderKey_', () => {
    it('should enable the download button if there are no expected render keys', () => {
      spyOn(view.downloadButtonDisabledHook_, 'set');

      view['updateRenderKey_']();
      assert(view.downloadButtonDisabledHook_.set).to.haveBeenCalledWith(false);
    });

    it('should disable the download button if there is an expected render key', () => {
      view['expectedRenderKeys_'].add('renderKey');
      spyOn(view.downloadButtonDisabledHook_, 'set');

      view['updateRenderKey_']();
      assert(view.downloadButtonDisabledHook_.set).to.haveBeenCalledWith(true);
    });
  });
});
