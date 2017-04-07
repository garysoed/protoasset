import { assert, Matchers, TestBase } from '../test-base';
TestBase.setup();

import { Arrays } from 'external/gs_tools/src/collection';
import { DomEvent, ListenableDom } from 'external/gs_tools/src/event';
import { Fakes, Mocks } from 'external/gs_tools/src/mock';
import { TestDispose } from 'external/gs_tools/src/testing';

import { RouteServiceEvents } from 'external/gs_ui/src/routing';

import { DataEvents } from '../data/data-events';
import { Helper } from '../data/helper';

import {
  ARG_DATA_HELPER,
  CONSOLE_ENTRY_DATA_HELPER,
  HELPER_ITEM_DATA_HELPER,
  HelperView } from './helper-view';


describe('ARG_DATA_HELPER', () => {
  describe('create', () => {
    it('should generate the correct element and listen to the click event', () => {
      const element = Mocks.object('element');
      const mockDocument = jasmine.createSpyObj('Document', ['createElement']);
      mockDocument.createElement.and.returnValue(element);

      const mockListenable = jasmine.createSpyObj('Listenable', ['on']);
      spyOn(ListenableDom, 'of').and.returnValue(mockListenable);

      const mockInstance = jasmine.createSpyObj('Instance', ['addDisposable', 'onArgClick']);

      const actualElement = ARG_DATA_HELPER.create(mockDocument, mockInstance);
      assert(actualElement).to.equal(element);
      assert(mockListenable.on).to
          .haveBeenCalledWith(DomEvent.CLICK, mockInstance.onArgClick, mockInstance);
      assert(mockInstance.addDisposable).to.haveBeenCalledWith(mockListenable);
      assert(ListenableDom.of).to.haveBeenCalledWith(element);
      assert(mockDocument.createElement).to.haveBeenCalledWith('div');
    });
  });

  describe('get', () => {
    it('should return the correct content', () => {
      const content = 'content';
      const element = Mocks.object('element');
      element.textContent = content;
      assert(ARG_DATA_HELPER.get(element)).to.equal(content);
    });
  });

  describe('set', () => {
    it('should set the arg label correctly', () => {
      const element = Mocks.object('element');
      const label = 'label';
      ARG_DATA_HELPER.set(label, element, Mocks.object('instance'));
      assert(element.textContent).to.equal(label);
    });
  });
});


describe('CONSOLE_ENTRY_DATA_HELPER', () => {
  describe('create', () => {
    it('should generate the console entry element correctly', () => {
      const mockRootClassList = jasmine.createSpyObj('RootClassList', ['add']);
      const mockRootEl = jasmine.createSpyObj('RootEl', ['appendChild']);
      mockRootEl.classList = mockRootClassList;

      const mockCommandClassList = jasmine.createSpyObj('CommandClassList', ['add']);
      const commandEl = Mocks.object('commandEl');
      commandEl.classList = mockCommandClassList;

      const resultEl = Mocks.object('resultEl');

      const mockDocument = jasmine.createSpyObj('Document', ['createElement']);
      mockDocument.createElement.and.returnValues(mockRootEl, commandEl, resultEl);

      assert(CONSOLE_ENTRY_DATA_HELPER.create(mockDocument, Mocks.object('instance')))
          .to.equal(mockRootEl);
      assert(mockRootEl.appendChild).to.haveBeenCalledWith(resultEl);
      assert(mockRootEl.appendChild).to.haveBeenCalledWith(commandEl);
      assert(mockDocument.createElement).to.haveBeenCalledWith('div');
      assert(mockCommandClassList.add).to.haveBeenCalledWith('gs-theme-invert');
      assert(mockRootClassList.add).to.haveBeenCalledWith('consoleEntry');
    });
  });

  describe('get', () => {
    it('should return the correct entry', () => {
      const isError = true;
      const mockClassList = jasmine.createSpyObj('ClassList', ['contains']);
      mockClassList.contains.and.returnValue(isError);
      const command = 'command';
      const result = 'result';

      const mockElement = jasmine.createSpyObj('Element', ['getAttribute']);
      mockElement.children = Mocks.itemList([
        {textContent: command},
        {classList: mockClassList},
      ]);
      mockElement.getAttribute.and.returnValue(result);
      assert(CONSOLE_ENTRY_DATA_HELPER.get(mockElement)).to.equal({command, isError, result});
      assert(mockElement.getAttribute).to.haveBeenCalledWith('pa-result');
      assert(mockClassList.contains).to.haveBeenCalledWith('error');
    });

    it('should return null if the command is null', () => {
      const isError = true;
      const mockClassList = jasmine.createSpyObj('ClassList', ['contains']);
      mockClassList.contains.and.returnValue(isError);
      const result = 'result';

      const mockElement = jasmine.createSpyObj('Element', ['getAttribute']);
      mockElement.children = Mocks.itemList([
        {textContent: null},
        {classList: mockClassList},
      ]);
      mockElement.getAttribute.and.returnValue(result);
      assert(CONSOLE_ENTRY_DATA_HELPER.get(mockElement)).to.beNull();
      assert(mockElement.getAttribute).to.haveBeenCalledWith('pa-result');
      assert(mockClassList.contains).to.haveBeenCalledWith('error');
    });

    it('should return null if the result is null', () => {
      const isError = true;
      const mockClassList = jasmine.createSpyObj('ClassList', ['contains']);
      mockClassList.contains.and.returnValue(isError);
      const command = 'command';

      const mockElement = jasmine.createSpyObj('Element', ['getAttribute']);
      mockElement.children = Mocks.itemList([
        {textContent: command},
        {classList: mockClassList},
      ]);
      mockElement.getAttribute.and.returnValue(null);
      assert(CONSOLE_ENTRY_DATA_HELPER.get(mockElement)).to.beNull();
      assert(mockElement.getAttribute).to.haveBeenCalledWith('pa-result');
      assert(mockClassList.contains).to.haveBeenCalledWith('error');
    });
  });

  describe('set', () => {
    it('should set the data correctly', () => {
      const command = 'command';
      const line1 = 'line1';
      const line2 = 'line2';
      const result = `${line1}\n  ${line2}`;

      const commandEl = document.createElement('div');
      const resultEl = document.createElement('div');
      const rootEl = document.createElement('div');
      rootEl.appendChild(commandEl);
      rootEl.appendChild(resultEl);

      CONSOLE_ENTRY_DATA_HELPER
          .set({command, isError: false, result}, rootEl, Mocks.object('instance'));

      assert(Arrays.fromItemList(resultEl.classList).asArray()).to.equal([]);
      assert(resultEl.innerHTML).to.equal(`<p>${line1}</p><p>&nbsp;&nbsp;${line2}</p>`);
      assert(commandEl.textContent).to.equal(command);
      assert(rootEl.getAttribute('pa-result')).to.equal(result);
    });

    it('should set the data correctly for errors', () => {
      const command = 'command';
      const line1 = 'line1';
      const line2 = 'line2';
      const result = `${line1}\n  ${line2}`;

      const commandEl = document.createElement('div');
      const resultEl = document.createElement('div');
      const rootEl = document.createElement('div');
      rootEl.appendChild(commandEl);
      rootEl.appendChild(resultEl);

      CONSOLE_ENTRY_DATA_HELPER
          .set({command, isError: true, result}, rootEl, Mocks.object('instance'));

      assert(Arrays.fromItemList(resultEl.classList).asArray()).to.equal(['error']);
      assert(resultEl.innerHTML).to.equal(`<p>${line1}</p><p>&nbsp;&nbsp;${line2}</p>`);
      assert(commandEl.textContent).to.equal(command);
    });
  });
});


describe('HELPER_ITEM_DATA_HELPER', () => {
  describe('create', () => {
    it('should set the attribute correctly', () => {
      const element = Mocks.object('element');
      const mockDocument = jasmine.createSpyObj('Document', ['createElement']);
      mockDocument.createElement.and.returnValue(element);
      assert(HELPER_ITEM_DATA_HELPER.create(mockDocument, Mocks.object('instance')))
          .to.equal(element);
      assert(mockDocument.createElement).to.haveBeenCalledWith('pa-asset-helper-item');
    });
  });

  describe('get', () => {
    it('should return the correct params', () => {
      const assetId = 'assetId';
      const helperId = 'helperId';
      const projectId = 'projectId';
      const mockElement = jasmine.createSpyObj('Element', ['getAttribute']);
      Fakes.build(mockElement.getAttribute)
          .when('asset-id').return(assetId)
          .when('helper-id').return(helperId)
          .when('project-id').return(projectId);
      assert(HELPER_ITEM_DATA_HELPER.get(mockElement)).to.equal({assetId, helperId, projectId});
      assert(mockElement.getAttribute).to.haveBeenCalledWith('asset-id');
      assert(mockElement.getAttribute).to.haveBeenCalledWith('helper-id');
      assert(mockElement.getAttribute).to.haveBeenCalledWith('project-id');
    });

    it('should return null if assetId is null', () => {
      const mockElement = jasmine.createSpyObj('Element', ['getAttribute']);
      Fakes.build(mockElement.getAttribute)
          .when('asset-id').return(null)
          .when('helper-id').return('helperId')
          .when('project-id').return('projectId');
      assert(HELPER_ITEM_DATA_HELPER.get(mockElement)).to.beNull();
    });

    it('should return null if helperId is null', () => {
      const mockElement = jasmine.createSpyObj('Element', ['getAttribute']);
      Fakes.build(mockElement.getAttribute)
          .when('asset-id').return('assetId')
          .when('helper-id').return(null)
          .when('project-id').return('projectId');
      assert(HELPER_ITEM_DATA_HELPER.get(mockElement)).to.beNull();
    });

    it('should return null if projectId is null', () => {
      const mockElement = jasmine.createSpyObj('Element', ['getAttribute']);
      Fakes.build(mockElement.getAttribute)
          .when('asset-id').return('assetId')
          .when('helper-id').return('helperId')
          .when('project-id').return(null);
      assert(HELPER_ITEM_DATA_HELPER.get(mockElement)).to.beNull();
    });
  });

  describe('set', () => {
    it('should set the attribute correctly', () => {
      const helperId = 'helperId';
      const assetId = 'assetId';
      const projectId = 'projectId';
      const mockElement = jasmine.createSpyObj('Element', ['setAttribute']);
      HELPER_ITEM_DATA_HELPER
          .set({assetId, helperId, projectId}, mockElement, Mocks.object('instance'));

      assert(mockElement.setAttribute).to.haveBeenCalledWith('asset-id', assetId);
      assert(mockElement.setAttribute).to.haveBeenCalledWith('helper-id', helperId);
      assert(mockElement.setAttribute).to.haveBeenCalledWith('project-id', projectId);
    });
  });
});


describe('asset.HelperView', () => {
  let mockAssetCollection;
  let mockRouteFactoryService;
  let mockRouteService;
  let mockSampleDataService;
  let mockTemplateCompilerService;
  let view: HelperView;

  beforeEach(() => {
    mockAssetCollection = jasmine.createSpyObj('AssetCollection', ['get', 'update']);
    mockRouteFactoryService = jasmine.createSpyObj('RouteFactoryService', ['helper', 'landing']);
    mockRouteService = jasmine.createSpyObj('RouteService', ['getParams', 'goTo', 'on']);
    mockSampleDataService = jasmine.createSpyObj('SampleDataService', ['getRowData']);
    mockTemplateCompilerService = jasmine.createSpyObj('TemplateCompilerService', ['create']);
    view = new HelperView(
        mockAssetCollection,
        mockRouteFactoryService,
        mockRouteService,
        mockSampleDataService,
        mockTemplateCompilerService,
        jasmine.createSpyObj('ThemeService', ['applyTheme']));
    TestDispose.add(view);
  });

  describe('createHelper_', () => {
    it('should create a new helper, update the asset, and navigate to it', async () => {
      const helperFactory = Mocks.object('helperFactory');
      mockRouteFactoryService.helper.and.returnValue(helperFactory);

      const assetId = 'assetId';
      const projectId = 'projectId';
      const newHelperId = 'newHelperId';
      spyOn(view['helperIdGenerator_'], 'generate').and.returnValue(newHelperId);

      const mockHelper = Mocks.object('newHelper');
      spyOn(Helper, 'of').and.returnValue(mockHelper);

      const existingHelperId = 'existingHelperId';
      const mockExistingHelper = jasmine.createSpyObj('ExistingHelper', ['getId']);
      mockExistingHelper.getId.and.returnValue(existingHelperId);
      const mockAsset = jasmine.createSpyObj(
          'Asset',
          ['getAllHelpers', 'getId', 'getProjectId', 'setHelper']);
      mockAsset.getAllHelpers.and.returnValues([mockExistingHelper]);
      mockAsset.getId.and.returnValue(assetId);
      mockAsset.getProjectId.and.returnValue(projectId);
      mockAssetCollection.get.and.returnValue(Promise.resolve(mockAsset));

      await view['createHelper_'](mockAsset);
      assert(mockRouteService.goTo).to.haveBeenCalledWith(
          helperFactory,
          {
            assetId: assetId,
            helperId: newHelperId,
            projectId: projectId,
          });
      assert(mockAssetCollection.update).to.haveBeenCalledWith(mockAsset);
      assert(mockAsset.setHelper).to.haveBeenCalledWith(newHelperId, mockHelper);
      assert(Helper.of).to.haveBeenCalledWith(newHelperId, `helper_${newHelperId}`);
      assert(view['helperIdGenerator_'].generate).to.haveBeenCalledWith([existingHelperId]);
    });
  });

  describe('getAsset_', () => {
    it('should resolve with the asset correctly', async () => {
      const asset = Mocks.object('asset');
      mockAssetCollection.get.and.returnValue(Promise.resolve(asset));

      const helper = Mocks.object('helper');
      mockRouteFactoryService.helper.and.returnValue(helper);

      const assetId = 'assetId';
      const projectId = 'projectId';
      mockRouteService.getParams.and.returnValue({assetId, projectId});

      const actualAsset = await view['getAsset_']();
      assert(actualAsset).to.equal(asset);
      assert(mockAssetCollection.get).to.haveBeenCalledWith(projectId, assetId);
      assert(mockRouteService.getParams).to.haveBeenCalledWith(helper);
    });

    it('should resolve with null if there are no params', async () => {
      const asset = Mocks.object('asset');
      mockAssetCollection.get.and.returnValue(Promise.resolve(asset));

      const helperRouteFactory = Mocks.object('helperRouteFactory');
      mockRouteFactoryService.helper.and.returnValue(helperRouteFactory);

      mockRouteService.getParams.and.returnValue(null);

      const actualAsset = await view['getAsset_']();
      assert(actualAsset).to.beNull();
    });
  });

  describe('getHelper_', () => {
    it('should resolve with the helper correctly', async () => {
      const helperRouteFactory = Mocks.object('helperRouteFactory');
      mockRouteFactoryService.helper.and.returnValue(helperRouteFactory);

      const helperId = 'helperId';
      mockRouteService.getParams.and.returnValue({helperId});

      const helper = Mocks.object('helper');
      const mockAsset = jasmine.createSpyObj('Asset', ['getHelper']);
      mockAsset.getHelper.and.returnValue(helper);

      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

      const actualHelper = await view['getHelper_']();
      assert(actualHelper).to.equal(helper);
      assert(mockRouteService.getParams).to.haveBeenCalledWith(helperRouteFactory);
      assert(mockAsset.getHelper).to.haveBeenCalledWith(helperId);
    });

    it('should resolve with null if the asset cannot be found', async () => {
      const helperRouteFactory = Mocks.object('helperRouteFactory');
      mockRouteFactoryService.helper.and.returnValue(helperRouteFactory);

      const helperId = 'helperId';
      mockRouteService.getParams.and.returnValue({helperId});

      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(null));

      const actualHelper = await view['getHelper_']();
      assert(actualHelper).to.beNull();
    });

    it('should resolve with null if there are no param', async () => {
      mockRouteFactoryService.helper.and.returnValue(Mocks.object('helperRouteFactory'));

      mockRouteService.getParams.and.returnValue(null);

      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(null));

      const actualHelper = await view['getHelper_']();
      assert(actualHelper).to.beNull();
    });
  });

  describe('onActiveChange_', () => {
    it('should call updateAsset_', async () => {
      const assetId = 'assetId';
      const projectId = 'projectId';
      const mockAsset = jasmine.createSpyObj('Asset', ['getId', 'getProjectId']);
      mockAsset.getId.and.returnValue(assetId);
      mockAsset.getProjectId.and.returnValue(projectId);
      const mockDeregister = jasmine.createSpyObj('Deregister', ['dispose']);
      view['assetUpdateDeregister_'] = mockDeregister;
      spyOn(view, 'updateAsset_');
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));
      spyOn(view.sampleDataPickerAssetIdHook_, 'set');
      spyOn(view.sampleDataPickerProjectIdHook_, 'set');
      await view['onActiveChange_'](true);
      assert(view['updateAsset_']).to.haveBeenCalledWith(mockAsset);
      assert(mockDeregister.dispose).to.haveBeenCalledWith();
      assert(view.sampleDataPickerAssetIdHook_.set).to.haveBeenCalledWith(assetId);
      assert(view.sampleDataPickerProjectIdHook_.set).to.haveBeenCalledWith(projectId);
    });

    it('should redirect to landing page if asset cannot be found', async () => {
      const landingRouteFactory = Mocks.object('landingRouteFactory');
      mockRouteFactoryService.landing.and.returnValue(landingRouteFactory);
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(null));
      await view['onActiveChange_'](true);
      assert(mockRouteService.goTo).to.haveBeenCalledWith(landingRouteFactory, {});
    });

    it('should do nothing if not activated', async () => {
      spyOn(view, 'getAsset_');

      await view['onActiveChange_'](false);
      assert(view['getAsset_']).toNot.haveBeenCalled();
    });

    it('should not throw error if there are no previous deregisters', async () => {
      const mockAsset = jasmine.createSpyObj('Asset', ['getId', 'getProjectId']);

      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));
      spyOn(view, 'updateAsset_');
      spyOn(view.sampleDataPickerAssetIdHook_, 'set');
      spyOn(view.sampleDataPickerProjectIdHook_, 'set');

      await view['onActiveChange_'](true);
    });
  });

  describe('onArgInputValueChange_', () => {
    it('should update the arg elements with the new args and clear the input element', () => {
      const arg1 = 'arg1';
      const arg2 = 'arg2';
      const newArg1 = 'newArg1';
      const newArg2 = 'newArg2';
      const newValue = `${newArg1}, ${newArg2}, ,`;

      spyOn(view['argElementsHook_'], 'get').and.returnValue([arg1, arg2]);
      spyOn(view['argElementsHook_'], 'set');
      spyOn(view['argInputHook_'], 'delete');

      view['onArgInputValueChange_'](newValue);

      assert(view['argInputHook_'].delete).to.haveBeenCalledWith();
      assert(view['argElementsHook_'].set).to.haveBeenCalledWith([arg1, arg2, newArg1, newArg2]);
    });

    it('should work if there are no existing args', () => {
      const newArg1 = 'newArg1';
      const newArg2 = 'newArg2';
      const newValue = `${newArg1}, ${newArg2}, ,`;

      spyOn(view['argElementsHook_'], 'get').and.returnValue(null);
      spyOn(view['argElementsHook_'], 'set');
      spyOn(view['argInputHook_'], 'delete');

      view['onArgInputValueChange_'](newValue);

      assert(view['argInputHook_'].delete).to.haveBeenCalledWith();
      assert(view['argElementsHook_'].set).to.haveBeenCalledWith([newArg1, newArg2]);
    });

    it('should do nothing if there are no commas in the input element', () => {
      const newValue = 'newValue';

      spyOn(view['argElementsHook_'], 'set');
      spyOn(view['argInputHook_'], 'delete');

      view['onArgInputValueChange_'](newValue);

      assert(view['argInputHook_'].delete).toNot.haveBeenCalled();
      assert(view['argElementsHook_'].set).toNot.haveBeenCalled();
    });

    it('should do nothing if the new input value is null', () => {
      spyOn(view['argElementsHook_'], 'set');
      spyOn(view['argInputHook_'], 'delete');

      view['onArgInputValueChange_'](null);

      assert(view['argInputHook_'].delete).toNot.haveBeenCalled();
      assert(view['argElementsHook_'].set).toNot.haveBeenCalled();
    });
  });

  describe('onAssetChanged_', () => {
    it('should update the UI elements for asset and helper', async () => {
      const currentHelperId = 'currentHelperId';

      const mockHelper = jasmine.createSpyObj('Helper', ['getArgs', 'getBody', 'getId', 'getName']);
      mockHelper.getId.and.returnValue(currentHelperId);
      spyOn(view, 'getHelper_').and.returnValue(Promise.resolve(mockHelper));

      const helperId1 = 'helperId1';
      const mockHelper1 = jasmine.createSpyObj('Helper1', ['getId']);
      mockHelper1.getId.and.returnValue(helperId1);

      const helperId2 = 'helperId2';
      const mockHelper2 = jasmine.createSpyObj('Helper2', ['getId']);
      mockHelper2.getId.and.returnValue(helperId2);

      const assetId = 'assetId';
      const projectId = 'projectId';
      const mockAsset = jasmine.createSpyObj('Asset', ['getAllHelpers', 'getId', 'getProjectId']);
      mockAsset.getAllHelpers.and.returnValue([mockHelper1, mockHelper2, mockHelper]);
      mockAsset.getId.and.returnValue(assetId);
      mockAsset.getProjectId.and.returnValue(projectId);

      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));
      spyOn(view, 'updateHelper_');
      spyOn(view['helperItemsHook_'], 'set');

      await view['onAssetChanged_'](mockAsset);
      assert(view['helperItemsHook_'].set).to.haveBeenCalledWith([
        {assetId, helperId: currentHelperId, projectId},
        {assetId, helperId: helperId1, projectId},
        {assetId, helperId: helperId2, projectId},
      ]);
      assert(view['updateHelper_']).to.haveBeenCalledWith(mockHelper);
    });

    it('should pick the first helper if there are no helpers selected', async () => {
      spyOn(view, 'getHelper_').and.returnValue(Promise.resolve(null));

      const helperId1 = 'helperId1';
      const mockHelper1 = jasmine.createSpyObj('Helper1', ['getId']);
      mockHelper1.getId.and.returnValue(helperId1);

      const helperId2 = 'helperId2';
      const mockHelper2 = jasmine.createSpyObj('Helper2', ['getId']);
      mockHelper2.getId.and.returnValue(helperId2);

      const assetId = 'assetId';
      const projectId = 'projectId';
      const mockAsset = jasmine.createSpyObj('Asset', ['getAllHelpers', 'getId', 'getProjectId']);
      mockAsset.getAllHelpers.and.returnValue([mockHelper1, mockHelper2]);
      mockAsset.getId.and.returnValue(assetId);
      mockAsset.getProjectId.and.returnValue(projectId);

      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));
      spyOn(view, 'updateHelper_');

      const helperFactoryService = Mocks.object('helperFactoryService');
      mockRouteFactoryService.helper.and.returnValue(helperFactoryService);

      await view['onAssetChanged_'](mockAsset);
      assert(mockRouteService.goTo).to.haveBeenCalledWith(
          helperFactoryService,
          {assetId, helperId: helperId1, projectId});
      assert(view['updateHelper_']).toNot.haveBeenCalled();
    });

    it('should create a new helper if there are no helpers in the asset', async () => {
      spyOn(view, 'getHelper_').and.returnValue(Promise.resolve(null));

      const mockAsset = jasmine.createSpyObj('Asset', ['getAllHelpers']);
      mockAsset.getAllHelpers.and.returnValue([]);

      spyOn(view, 'createHelper_').and.returnValue(Promise.resolve());
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));
      spyOn(view, 'updateHelper_');

      const helperFactoryService = Mocks.object('helperFactoryService');
      mockRouteFactoryService.helper.and.returnValue(helperFactoryService);

      await view['onAssetChanged_'](mockAsset);
      assert(view['createHelper_']).to.haveBeenCalledWith(mockAsset);
      assert(view['updateHelper_']).toNot.haveBeenCalled();
    });
  });

  describe('onChanges_', () => {
    it('should update the helper and the asset correctly', async () => {
      const args = Mocks.object('args');
      spyOn(view['argElementsHook_'], 'get').and.returnValue(args);

      const body = 'body';
      spyOn(view['bodyInputHook_'], 'get').and.returnValue(body);

      const helperId = 'helperId';
      const mockHelper = jasmine.createSpyObj('Helper', ['getId', 'setArgs', 'setBody', 'setName']);
      mockHelper.getId.and.returnValue(helperId);
      spyOn(view, 'getHelper_').and.returnValue(Promise.resolve(mockHelper));

      const mockAsset = jasmine.createSpyObj('Asset', ['setHelper']);
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

      await view['onChanges_']();
      assert(mockAssetCollection.update).to.haveBeenCalledWith(mockAsset);
      assert(mockAsset.setHelper).to.haveBeenCalledWith(helperId, mockHelper);
      assert(mockHelper.setBody).to.haveBeenCalledWith(body);
      assert(mockHelper.setArgs).to.haveBeenCalledWith(args);
    });

    it('should do nothing if the helper cannot be found', async () => {
      const args = Mocks.object('args');
      spyOn(view['argElementsHook_'], 'get').and.returnValue(args);

      const body = 'body';
      spyOn(view['bodyInputHook_'], 'get').and.returnValue(body);

      spyOn(view, 'getHelper_').and.returnValue(Promise.resolve(null));
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(Mocks.object('asset')));

      await view['onChanges_']();
      assert(mockAssetCollection.update).toNot.haveBeenCalled();
    });

    it('should do nothing if the asset cannot be found', async () => {
      const args = Mocks.object('args');
      spyOn(view['argElementsHook_'], 'get').and.returnValue(args);

      const body = 'body';
      spyOn(view['bodyInputHook_'], 'get').and.returnValue(body);

      spyOn(view, 'getHelper_').and.returnValue(Promise.resolve(Mocks.object('helper')));
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(null));

      await view['onChanges_']();
      assert(mockAssetCollection.update).toNot.haveBeenCalled();
    });

    it('should do nothing if args is null', async () => {
      spyOn(view['argElementsHook_'], 'get').and.returnValue(null);

      const body = 'body';
      spyOn(view['bodyInputHook_'], 'get').and.returnValue(body);

      spyOn(view, 'getHelper_').and.returnValue(Promise.resolve(Mocks.object('helper')));
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(Mocks.object('asset')));

      await view['onChanges_']();
      assert(mockAssetCollection.update).toNot.haveBeenCalled();
    });

    it('should do nothing if body is null', async () => {
      const args = Mocks.object('args');
      spyOn(view['argElementsHook_'], 'get').and.returnValue(args);
      spyOn(view['bodyInputHook_'], 'get').and.returnValue(null);

      spyOn(view, 'getHelper_').and.returnValue(Promise.resolve(Mocks.object('helper')));
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(Mocks.object('asset')));

      await view['onChanges_']();
      assert(mockAssetCollection.update).toNot.haveBeenCalled();
    });
  });

  describe('onCreateButtonClick_', () => {
    it('should call creaateHelper_ correctly', async () => {
      const asset = Mocks.object('asset');
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(asset));
      spyOn(view, 'createHelper_');
      await view['onCreateButtonClick_']();
      assert(view['createHelper_']).to.haveBeenCalledWith(asset);
    });

    it('should do nothing if there are no assets', async () => {
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(null));
      spyOn(view, 'createHelper_');
      await view['onCreateButtonClick_']();
      assert(view['createHelper_']).toNot.haveBeenCalled();
    });
  });

  describe('onExecuteButtonClick_', () => {
    it('should execute the code, update the console, and scroll to the bottom of the console',
        async () => {
          const asset = Mocks.object('asset');
          spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(asset));

          const command = 'command';
          spyOn(view['consoleInputHook_'], 'get').and.returnValue(command);

          const entry1 = Mocks.object('entry1');
          const entry2 = Mocks.object('entry2');
          spyOn(view['consoleEntryHook_'], 'get').and.returnValue([entry1, entry2]);
          spyOn(view['consoleEntryHook_'], 'set');

          const result = 'result';

          const mockCompiler = jasmine.createSpyObj('Compiler', ['compile']);
          mockCompiler.compile.and.returnValue(result);
          mockTemplateCompilerService.create.and.returnValue(mockCompiler);

          const scrollHeight = 123;
          const containerEl = Mocks.object('containerEl');
          containerEl.scrollHeight = scrollHeight;

          const mockShadowRoot = jasmine.createSpyObj('ShadowRoot', ['querySelector']);
          mockShadowRoot.querySelector.and.returnValue(containerEl);

          const element = Mocks.object('element');
          element.shadowRoot = mockShadowRoot;
          const mockListenable = jasmine.createSpyObj('Listenable', ['getEventTarget']);
          mockListenable.getEventTarget.and.returnValue(element);
          spyOn(view, 'getElement').and.returnValue(mockListenable);

          const rowData = Mocks.object('rowData');
          mockSampleDataService.getRowData.and.returnValue(Promise.resolve(rowData));

          await view['onExecuteButtonClick_']();
          assert(containerEl.scrollTop).to.equal(scrollHeight);
          assert(mockShadowRoot.querySelector).to.haveBeenCalledWith('#consoleContainer');
          assert(view['consoleEntryHook_'].set).to.haveBeenCalledWith([
            entry1,
            entry2,
            {command, isError: false, result},
          ]);
          assert(mockCompiler.compile).to.haveBeenCalledWith(command);
          assert(mockTemplateCompilerService.create).to.haveBeenCalledWith(asset, rowData);
        });

    it('should handle error thrown during compile step correctly', async () => {
      const asset = Mocks.object('asset');
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(asset));

      const command = 'command';
      spyOn(view['consoleInputHook_'], 'get').and.returnValue(command);

      const entry1 = Mocks.object('entry1');
      const entry2 = Mocks.object('entry2');
      spyOn(view['consoleEntryHook_'], 'get').and.returnValue([entry1, entry2]);
      spyOn(view['consoleEntryHook_'], 'set');

      const message = 'message';
      const stack = 'stack';
      const error = {message, stack};
      Object.setPrototypeOf(error, Error.prototype);
      const mockCompiler = jasmine.createSpyObj('Compiler', ['compile']);
      mockCompiler.compile.and.throwError(error);
      mockTemplateCompilerService.create.and.returnValue(mockCompiler);

      const scrollHeight = 123;
      const containerEl = Mocks.object('containerEl');
      containerEl.scrollHeight = scrollHeight;

      const mockShadowRoot = jasmine.createSpyObj('ShadowRoot', ['querySelector']);
      mockShadowRoot.querySelector.and.returnValue(containerEl);

      const element = Mocks.object('element');
      element.shadowRoot = mockShadowRoot;
      const mockListenable = jasmine.createSpyObj('Listenable', ['getEventTarget']);
      mockListenable.getEventTarget.and.returnValue(element);
      spyOn(view, 'getElement').and.returnValue(mockListenable);

      const rowData = Mocks.object('rowData');
      mockSampleDataService.getRowData.and.returnValue(Promise.resolve(rowData));

      await view['onExecuteButtonClick_']();
      assert(containerEl.scrollTop).to.equal(scrollHeight);
      assert(mockShadowRoot.querySelector).to.haveBeenCalledWith('#consoleContainer');
      assert(view['consoleEntryHook_'].set).to.haveBeenCalledWith([
        entry1,
        entry2,
        {command, isError: true, result: `${message}\n\n${stack}`},
      ]);
      assert(mockCompiler.compile).to.haveBeenCalledWith(command);
      assert(mockTemplateCompilerService.create).to.haveBeenCalledWith(asset, rowData);
    });

    it('should not scroll to the bottom if the element cannot be found', async () => {
      const asset = Mocks.object('asset');
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(asset));

      const command = 'command';
      spyOn(view['consoleInputHook_'], 'get').and.returnValue(command);

      const entry1 = Mocks.object('entry1');
      const entry2 = Mocks.object('entry2');
      spyOn(view['consoleEntryHook_'], 'get').and.returnValue([entry1, entry2]);
      spyOn(view['consoleEntryHook_'], 'set');

      const message = 'message';
      const stack = 'stack';
      const error = {message, stack};
      Object.setPrototypeOf(error, Error.prototype);
      const mockCompiler = jasmine.createSpyObj('Compiler', ['compile']);
      mockCompiler.compile.and.throwError(error);
      mockTemplateCompilerService.create.and.returnValue(mockCompiler);

      spyOn(view, 'getElement').and.returnValue(null);

      const rowData = Mocks.object('rowData');
      mockSampleDataService.getRowData.and.returnValue(Promise.resolve(rowData));

      await view['onExecuteButtonClick_']();
      assert(view['consoleEntryHook_'].set).to.haveBeenCalledWith([
        entry1,
        entry2,
        {command, isError: true, result: `${message}\n\n${stack}`},
      ]);
      assert(mockCompiler.compile).to.haveBeenCalledWith(command);
      assert(mockTemplateCompilerService.create).to.haveBeenCalledWith(asset, rowData);
    });

    it('should do nothing if the compiler cannot be created', async () => {
      const asset = Mocks.object('asset');
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(asset));

      const command = 'command';
      spyOn(view['consoleInputHook_'], 'get').and.returnValue(command);
      spyOn(view['consoleEntryHook_'], 'set');

      const rowData = Mocks.object('rowData');
      mockSampleDataService.getRowData.and.returnValue(Promise.resolve(rowData));

      mockTemplateCompilerService.create.and.returnValue(null);

      await view['onExecuteButtonClick_']();
      assert(view['consoleEntryHook_'].set).toNot.haveBeenCalled();
      assert(mockTemplateCompilerService.create).to.haveBeenCalledWith(asset, rowData);
    });

    it('should do nothing if asset cannot be found', async () => {
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(null));

      const command = 'command';
      spyOn(view['consoleInputHook_'], 'get').and.returnValue(command);
      spyOn(view['consoleEntryHook_'], 'set');
      mockTemplateCompilerService.create.and.returnValue(null);

      const rowData = Mocks.object('rowData');
      mockSampleDataService.getRowData.and.returnValue(Promise.resolve(rowData));

      await view['onExecuteButtonClick_']();
      assert(view['consoleEntryHook_'].set).toNot.haveBeenCalled();
      assert(mockTemplateCompilerService.create).toNot.haveBeenCalled();
    });

    it('should do nothing if the row data cannot be found', async () => {
      const asset = Mocks.object('asset');
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(asset));

      const command = 'command';
      spyOn(view['consoleInputHook_'], 'get').and.returnValue(command);
      spyOn(view['consoleEntryHook_'], 'set');
      mockTemplateCompilerService.create.and.returnValue(null);

      mockSampleDataService.getRowData.and.returnValue(Promise.resolve(null));

      await view['onExecuteButtonClick_']();
      assert(view['consoleEntryHook_'].set).toNot.haveBeenCalled();
      assert(mockTemplateCompilerService.create).toNot.haveBeenCalled();
    });

    it('should do nothing if the console has no values', async () => {
      spyOn(view['consoleInputHook_'], 'get').and.returnValue(null);
      spyOn(view['consoleEntryHook_'], 'set');

      mockTemplateCompilerService.create.and.returnValue(null);

      await view['onExecuteButtonClick_']();
      assert(view['consoleEntryHook_'].set).toNot.haveBeenCalled();
      assert(mockTemplateCompilerService.create).toNot.haveBeenCalled();
    });
  });

  describe('onHelperChanged_', () => {
    it('should update the name, argElements, and body input', () => {
      const name = 'name';
      const args = Mocks.object('args');
      const body = 'body';
      const mockHelper = jasmine.createSpyObj('Helper', ['getArgs', 'getBody', 'getName']);
      mockHelper.getArgs.and.returnValue(args);
      mockHelper.getBody.and.returnValue(body);
      mockHelper.getName.and.returnValue(name);

      spyOn(view['nameHook_'], 'set');
      spyOn(view['argElementsHook_'], 'set');
      spyOn(view['bodyInputHook_'], 'set');

      view['onHelperChanged_'](mockHelper);

      assert(view['nameHook_'].set).to.haveBeenCalledWith(name);
      assert(view['argElementsHook_'].set).to.haveBeenCalledWith(args);
      assert(view['bodyInputHook_'].set).to.haveBeenCalledWith(body);
    });
  });

  describe('onRouteChanged_', () => {
    it('should call onActiveChange_ with true if the view is active', () => {
      spyOn(view, 'onActiveChange_');
      mockRouteService.getParams.and.returnValue({});

      const helperFactory = Mocks.object('helperFactory');
      mockRouteFactoryService.helper.and.returnValue(helperFactory);

      view['onRouteChanged_']();

      assert(view['onActiveChange_']).to.haveBeenCalledWith(true);
      assert(mockRouteService.getParams).to.haveBeenCalledWith(helperFactory);
    });

    it('should call onActiveChange_ with false if the view is inactive', () => {
      spyOn(view, 'onActiveChange_');
      mockRouteService.getParams.and.returnValue(null);

      const helperFactory = Mocks.object('helperFactory');
      mockRouteFactoryService.helper.and.returnValue(helperFactory);

      view['onRouteChanged_']();

      assert(view['onActiveChange_']).to.haveBeenCalledWith(false);
      assert(mockRouteService.getParams).to.haveBeenCalledWith(helperFactory);
    });
  });

  describe('updateAsset_', () => {
    it('should dispose the previous deregister and listen to changed event', () => {
      const mockDeregister = jasmine.createSpyObj('Deregister', ['dispose']);
      view['assetUpdateDeregister_'] = mockDeregister;

      const mockNewDeregister = jasmine.createSpyObj('NewDeregister', ['dispose']);
      const mockAsset = jasmine.createSpyObj('Asset', ['on']);
      mockAsset.on.and.returnValue(mockNewDeregister);

      const assetChangedSpy = spyOn(view, 'onAssetChanged_');

      view['updateAsset_'](mockAsset);
      assert(mockAsset.on).to
          .haveBeenCalledWith(DataEvents.CHANGED, Matchers.any(Function), view);

      assetChangedSpy.calls.reset();
      mockAsset.on.calls.argsFor(0)[1]();
      assert(view['onAssetChanged_']).to.haveBeenCalledWith(mockAsset);

      assert(view['assetUpdateDeregister_']).to.equal(mockNewDeregister);
      assert(mockDeregister.dispose).to.haveBeenCalledWith();
    });

    it('should not throw error if there are no previous deregister functions', () => {
      view['assetUpdateDeregister_'] = null;

      const mockNewDeregister = jasmine.createSpyObj('NewDeregister', ['dispose']);
      const mockAsset = jasmine.createSpyObj('Asset', ['on']);
      mockAsset.on.and.returnValue(mockNewDeregister);

      spyOn(view, 'onAssetChanged_');

      assert(() => {
        view['updateAsset_'](mockAsset);
      }).toNot.throw();

      assert(mockAsset.on).to
          .haveBeenCalledWith(DataEvents.CHANGED, Matchers.any(Function), view);
      assert(view['onAssetChanged_']).to.haveBeenCalledWith(mockAsset);
    });
  });

  describe('updateHelper_', () => {
    it('should dispose the previous deregister and listen to changed events to helper', () => {
      const mockDeregister = jasmine.createSpyObj('Deregister', ['dispose']);
      view['helperUpdateDeregister_'] = mockDeregister;

      const mockNewDeregister = jasmine.createSpyObj('NewDeregister', ['dispose']);
      const mockHelper = jasmine.createSpyObj('Helper', ['on']);
      mockHelper.on.and.returnValue(mockNewDeregister);

      const helperChangedSpy = spyOn(view, 'onHelperChanged_');

      view['updateHelper_'](mockHelper);
      assert(mockHelper.on).to
          .haveBeenCalledWith(DataEvents.CHANGED, Matchers.any(Function), view);

      helperChangedSpy.calls.reset();
      mockHelper.on.calls.argsFor(0)[1]();
      assert(view['onHelperChanged_']).to.haveBeenCalledWith(mockHelper);

      assert(view['helperUpdateDeregister_']).to.equal(mockNewDeregister);
      assert(mockDeregister.dispose).to.haveBeenCalledWith();
  });

    it('should not throw errors if there are no previous deregisters', () => {
      view['helperUpdateDeregister_'] = null;

      const mockNewDeregister = jasmine.createSpyObj('NewDeregister', ['dispose']);
      const mockHelper = jasmine.createSpyObj('Helper', ['on']);
      mockHelper.on.and.returnValue(mockNewDeregister);

      spyOn(view, 'onHelperChanged_');

      assert(() => {
        view['updateHelper_'](mockHelper);
      }).toNot.throw();

      assert(mockHelper.on).to
          .haveBeenCalledWith(DataEvents.CHANGED, Matchers.any(Function), view);
      assert(view['onHelperChanged_']).to.haveBeenCalledWith(mockHelper);
    });
  });

  describe('disposeInternal', () => {
    it('should dispose the asset update deregister and helper update deregister', () => {
      const mockAssetUpdateDeregister = jasmine.createSpyObj('AssetUpdateDeregister', ['dispose']);
      view['assetUpdateDeregister_'] = mockAssetUpdateDeregister;

      const mockHelperUpdateDeregister =
          jasmine.createSpyObj('HelperUpdateDeregister', ['dispose']);
      view['helperUpdateDeregister_'] = mockHelperUpdateDeregister;

      view.disposeInternal();
      assert(mockAssetUpdateDeregister.dispose).to.haveBeenCalledWith();
      assert(mockHelperUpdateDeregister.dispose).to.haveBeenCalledWith();
    });

    it('should not throw error if there are no asset update deregisters', () => {
      assert(() => {
        view.disposeInternal();
      }).toNot.throw();
    });
  });

  describe('onArgClick', () => {
    it('should remove the argument and update the arg elements', () => {
      const arg1 = 'arg1';
      const arg2 = 'arg2';
      const arg3 = 'arg3';
      spyOn(view['argElementsHook_'], 'get').and.returnValue([arg1, arg2, arg3]);
      spyOn(view['argElementsHook_'], 'set');

      const child1 = document.createElement('child1');
      const child2 = document.createElement('child2');
      const child3 = document.createElement('child3');
      const rootEl = document.createElement('root');
      rootEl.appendChild(child1);
      rootEl.appendChild(child2);
      rootEl.appendChild(child3);

      view.onArgClick(<Event> <any> {target: child2});

      assert(view['argElementsHook_'].set).to.haveBeenCalledWith([arg1, arg3]);
    });

    it('should do nothing if there are no args', () => {
      spyOn(view['argElementsHook_'], 'get').and.returnValue(null);
      spyOn(view['argElementsHook_'], 'set');

      view.onArgClick(<Event> <any> {target: document.createElement('child')});

      assert(view['argElementsHook_'].set).toNot.haveBeenCalled();
    });

    it('should do nothing if the event target is not an element', () => {
      spyOn(view['argElementsHook_'], 'set');

      view.onArgClick(<Event> <any> {target: {}});

      assert(view['argElementsHook_'].set).toNot.haveBeenCalled();
    });
  });

  describe('onCreated', () => {
    it('should listen to route service changed event', () => {
      const mockDeregister = jasmine.createSpyObj('Deregister', ['dispose']);
      mockRouteService.on.and.returnValue(mockDeregister);

      spyOn(view, 'addDisposable').and.callThrough();
      spyOn(view, 'onRouteChanged_');

      const element = Mocks.object('element');
      view.onCreated(element);
      assert(view.addDisposable).to.haveBeenCalledWith(mockDeregister);
      assert(mockRouteService.on).to
          .haveBeenCalledWith(RouteServiceEvents.CHANGED, view['onRouteChanged_'], view);
      assert(view['onRouteChanged_']).to.haveBeenCalledWith();
    });
  });
});
