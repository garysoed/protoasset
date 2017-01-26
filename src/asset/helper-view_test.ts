import {assert, Matchers, TestBase} from '../test-base';
TestBase.setup();

import {Arrays} from 'external/gs_tools/src/collection';
import {DomEvent, ListenableDom} from 'external/gs_tools/src/event';
import {Mocks} from 'external/gs_tools/src/mock';
import {TestDispose} from 'external/gs_tools/src/testing';

import {RouteServiceEvents} from 'external/gs_ui/src/routing';

import {DataEvents} from '../data/data-events';
import {Helper} from '../data/helper';

import {
  argElementDataSetter,
  argElementGenerator,
  consoleEntryDataSetter,
  consoleEntryGenerator,
  helperItemDataSetter,
  helperItemGenerator,
  HelperView} from './helper-view';


describe('argElementGenerator', () => {
  it('should generate the correct element and listen to the click event', () => {
    let element = Mocks.object('element');
    let mockDocument = jasmine.createSpyObj('Document', ['createElement']);
    mockDocument.createElement.and.returnValue(element);

    let mockListenable = jasmine.createSpyObj('Listenable', ['on']);
    spyOn(ListenableDom, 'of').and.returnValue(mockListenable);

    let mockInstance = jasmine.createSpyObj('Instance', ['addDisposable', 'onArgClick']);

    let actualElement = argElementGenerator(mockDocument, mockInstance);
    assert(actualElement).to.equal(element);
    assert(mockListenable.on).to
        .haveBeenCalledWith(DomEvent.CLICK, mockInstance.onArgClick, mockInstance);
    assert(mockInstance.addDisposable).to.haveBeenCalledWith(mockListenable);
    assert(ListenableDom.of).to.haveBeenCalledWith(element);
    assert(mockDocument.createElement).to.haveBeenCalledWith('div');
  });
});

describe('argElementDataSetter', () => {
  it('should set the arg label correctly', () => {
    let element = Mocks.object('element');
    let label = 'label';
    argElementDataSetter(label, element);
    assert(element.textContent).to.equal(label);
  });
});

describe('consoleEntryGenerator', () => {
  it('should generate the console entry element correctly', () => {
    let mockRootClassList = jasmine.createSpyObj('RootClassList', ['add']);
    let mockRootEl = jasmine.createSpyObj('RootEl', ['appendChild']);
    mockRootEl.classList = mockRootClassList;

    let mockCommandClassList = jasmine.createSpyObj('CommandClassList', ['add']);
    let commandEl = Mocks.object('commandEl');
    commandEl.classList = mockCommandClassList;

    let resultEl = Mocks.object('resultEl');

    let mockDocument = jasmine.createSpyObj('Document', ['createElement']);
    mockDocument.createElement.and.returnValues(mockRootEl, commandEl, resultEl);

    assert(consoleEntryGenerator(mockDocument)).to.equal(mockRootEl);
    assert(mockRootEl.appendChild).to.haveBeenCalledWith(resultEl);
    assert(mockRootEl.appendChild).to.haveBeenCalledWith(commandEl);
    assert(mockDocument.createElement).to.haveBeenCalledWith('div');
    assert(mockCommandClassList.add).to.haveBeenCalledWith('gs-theme-invert');
    assert(mockRootClassList.add).to.haveBeenCalledWith('consoleEntry');
  });
});

describe('consoleEntryDataSetter', () => {
  it('should set the data correctly', () => {
    let command = 'command';
    let line1 = 'line1';
    let line2 = 'line2';
    let result = `${line1}\n  ${line2}`;

    let commandEl = document.createElement('div');
    let resultEl = document.createElement('div');
    let rootEl = document.createElement('div');
    rootEl.appendChild(commandEl);
    rootEl.appendChild(resultEl);

    consoleEntryDataSetter({command, isError: false, result}, rootEl);

    assert(Arrays.fromItemList(resultEl.classList).asArray()).to.equal([]);
    assert(resultEl.innerHTML).to.equal(`<p>${line1}</p><p>&nbsp;&nbsp;${line2}</p>`);
    assert(commandEl.textContent).to.equal(command);
  });

  it('should set the data correctly for errors', () => {
    let command = 'command';
    let line1 = 'line1';
    let line2 = 'line2';
    let result = `${line1}\n  ${line2}`;

    let commandEl = document.createElement('div');
    let resultEl = document.createElement('div');
    let rootEl = document.createElement('div');
    rootEl.appendChild(commandEl);
    rootEl.appendChild(resultEl);

    consoleEntryDataSetter({command, isError: true, result}, rootEl);

    assert(Arrays.fromItemList(resultEl.classList).asArray()).to.equal(['error']);
    assert(resultEl.innerHTML).to.equal(`<p>${line1}</p><p>&nbsp;&nbsp;${line2}</p>`);
    assert(commandEl.textContent).to.equal(command);
  });
});

describe('helperItemDataSetter', () => {
  it('should set the attribute correctly', () => {
    let helperId = 'helperId';
    let assetId = 'assetId';
    let projectId = 'projectId';
    let mockElement = jasmine.createSpyObj('Element', ['setAttribute']);
    helperItemDataSetter({assetId, helperId, projectId}, mockElement);

    assert(mockElement.setAttribute).to.haveBeenCalledWith('asset-id', assetId);
    assert(mockElement.setAttribute).to.haveBeenCalledWith('helper-id', helperId);
    assert(mockElement.setAttribute).to.haveBeenCalledWith('project-id', projectId);
  });
});

describe('helperItemGenerator', () => {
  it('should set the attribute correctly', () => {
    let element = Mocks.object('element');
    let mockDocument = jasmine.createSpyObj('Document', ['createElement']);
    mockDocument.createElement.and.returnValue(element);
    assert(helperItemGenerator(mockDocument)).to.equal(element);
    assert(mockDocument.createElement).to.haveBeenCalledWith('pa-asset-helper-item');
  });
});

describe('asset.HelperView', () => {
  let mockAssetCollection;
  let mockRouteFactoryService;
  let mockRouteService;
  let mockTemplateCompilerService;
  let view: HelperView;

  beforeEach(() => {
    mockAssetCollection = jasmine.createSpyObj('AssetCollection', ['get', 'update']);
    mockRouteFactoryService = jasmine.createSpyObj('RouteFactoryService', ['helper', 'landing']);
    mockRouteService = jasmine.createSpyObj('RouteService', ['getParams', 'goTo', 'on']);
    mockTemplateCompilerService = jasmine.createSpyObj('TemplateCompilerService', ['create']);
    view = new HelperView(
        mockAssetCollection,
        mockRouteFactoryService,
        mockRouteService,
        mockTemplateCompilerService,
        jasmine.createSpyObj('ThemeService', ['applyTheme']));
    TestDispose.add(view);
  });

  describe('createHelper_', () => {
    it('should create a new helper, update the asset, and navigate to it', (done: any) => {
      let helperFactory = Mocks.object('helperFactory');
      mockRouteFactoryService.helper.and.returnValue(helperFactory);

      let assetId = 'assetId';
      let projectId = 'projectId';
      let existingHelperId = 'existingHelperId';
      spyOn(view['helperIdGenerator_'], 'generate').and.returnValue(existingHelperId);

      let newHelperId = 'newHelperId';
      spyOn(view['helperIdGenerator_'], 'resolveConflict').and.returnValue(newHelperId);

      let mockHelper = Mocks.object('newHelper');
      spyOn(Helper, 'of').and.returnValue(mockHelper);

      let existingHelper = Mocks.object('otherHelper');
      let mockAsset = jasmine.createSpyObj(
          'Asset',
          ['getHelper', 'getId', 'getProjectId', 'setHelper']);
      mockAsset.getHelper.and.returnValues(existingHelper, null);
      mockAsset.getId.and.returnValue(assetId);
      mockAsset.getProjectId.and.returnValue(projectId);
      mockAssetCollection.get.and.returnValue(Promise.resolve(mockAsset));

      view['createHelper_'](mockAsset)
          .then(() => {
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
            assert(view['helperIdGenerator_'].resolveConflict).to
                .haveBeenCalledWith(existingHelperId);
            assert(mockAsset.getHelper).to.haveBeenCalledWith(existingHelperId);
            assert(mockAsset.getHelper).to.haveBeenCalledWith(newHelperId);
            done();
          }, done.fail);
    });
  });

  describe('getAsset_', () => {
    it('should resolve with the asset correctly', (done: any) => {
      let asset = Mocks.object('asset');
      mockAssetCollection.get.and.returnValue(Promise.resolve(asset));

      let helper = Mocks.object('helper');
      mockRouteFactoryService.helper.and.returnValue(helper);

      let assetId = 'assetId';
      let projectId = 'projectId';
      mockRouteService.getParams.and.returnValue({assetId, projectId});

      view['getAsset_']()
          .then((actualAsset: any) => {
            assert(actualAsset).to.equal(asset);
            assert(mockAssetCollection.get).to.haveBeenCalledWith(projectId, assetId);
            assert(mockRouteService.getParams).to.haveBeenCalledWith(helper);
            done();
          }, done.fail);
    });

    it('should resolve with null if there are no params', (done: any) => {
      let asset = Mocks.object('asset');
      mockAssetCollection.get.and.returnValue(Promise.resolve(asset));

      let helperRouteFactory = Mocks.object('helperRouteFactory');
      mockRouteFactoryService.helper.and.returnValue(helperRouteFactory);

      mockRouteService.getParams.and.returnValue(null);

      view['getAsset_']()
          .then((actualAsset: any) => {
            assert(actualAsset).to.beNull();
            done();
          }, done.fail);
    });
  });

  describe('getHelper_', () => {
    it('should resolve with the helper correctly', (done: any) => {
      let helperRouteFactory = Mocks.object('helperRouteFactory');
      mockRouteFactoryService.helper.and.returnValue(helperRouteFactory);

      let helperId = 'helperId';
      mockRouteService.getParams.and.returnValue({helperId});

      let helper = Mocks.object('helper');
      let mockAsset = jasmine.createSpyObj('Asset', ['getHelper']);
      mockAsset.getHelper.and.returnValue(helper);

      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

      view['getHelper_']()
          .then((actualHelper: any) => {
            assert(actualHelper).to.equal(helper);
            assert(mockRouteService.getParams).to.haveBeenCalledWith(helperRouteFactory);
            assert(mockAsset.getHelper).to.haveBeenCalledWith(helperId);
            done();
          }, done.fail);
    });

    it('should resolve with null if the asset cannot be found', (done: any) => {
      let helperRouteFactory = Mocks.object('helperRouteFactory');
      mockRouteFactoryService.helper.and.returnValue(helperRouteFactory);

      let helperId = 'helperId';
      mockRouteService.getParams.and.returnValue({helperId});

      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(null));

      view['getHelper_']()
          .then((actualHelper: any) => {
            assert(actualHelper).to.beNull();
            done();
          }, done.fail);
    });

    it('should resolve with null if there are no param', (done: any) => {
      mockRouteFactoryService.helper.and.returnValue(Mocks.object('helperRouteFactory'));

      mockRouteService.getParams.and.returnValue(null);

      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(null));

      view['getHelper_']()
          .then((actualHelper: any) => {
            assert(actualHelper).to.beNull();
            done();
          }, done.fail);
    });
  });

  describe('onActiveChange_', () => {
    it('should call updateAsset_', (done: any) => {
      let asset = Mocks.object('asset');
      spyOn(view, 'updateAsset_');
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(asset));
      view['onActiveChange_'](true)
          .then(() => {
            assert(view['updateAsset_']).to.haveBeenCalledWith(asset);
            done();
          }, done.fail);
    });

    it('should redirect to landing page if asset cannot be found', (done: any) => {
      let landingRouteFactory = Mocks.object('landingRouteFactory');
      mockRouteFactoryService.landing.and.returnValue(landingRouteFactory);
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(null));
      view['onActiveChange_'](true)
          .then(() => {
            assert(mockRouteService.goTo).to.haveBeenCalledWith(landingRouteFactory, {});
            done();
          }, done.fail);
    });

    it('should do nothing if not activated', (done: any) => {
      spyOn(view, 'getAsset_');

      view['onActiveChange_'](false)
          .then(() => {
            assert(view['getAsset_']).toNot.haveBeenCalled();
            done();
          }, done.fail);
    });

    it('should not throw error if there are no previous deregisters', (done: any) => {
          let mockNewDeregister = jasmine.createSpyObj('NewDeregister', ['dispose']);
          let mockAsset = jasmine.createSpyObj('Asset', ['on']);
          mockAsset.on.and.returnValue(mockNewDeregister);

          spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));
          spyOn(view, 'updateAsset_');

          view['onActiveChange_'](true)
              .then(() => {
                done();
              }, done.fail);
    });
  });

  describe('onArgInputValueChange_', () => {
    it('should update the arg elements with the new args and clear the input element', () => {
      let arg1 = 'arg1';
      let arg2 = 'arg2';
      let newArg1 = 'newArg1';
      let newArg2 = 'newArg2';
      let newValue = `${newArg1}, ${newArg2}, ,`;

      spyOn(view['argElementsBridge_'], 'get').and.returnValue([arg1, arg2]);
      spyOn(view['argElementsBridge_'], 'set');
      spyOn(view['argInputBridge_'], 'delete');

      view['onArgInputValueChange_'](newValue);

      assert(view['argInputBridge_'].delete).to.haveBeenCalledWith();
      assert(view['argElementsBridge_'].set).to.haveBeenCalledWith([arg1, arg2, newArg1, newArg2]);
    });

    it('should work if there are no existing args', () => {
      let newArg1 = 'newArg1';
      let newArg2 = 'newArg2';
      let newValue = `${newArg1}, ${newArg2}, ,`;

      spyOn(view['argElementsBridge_'], 'get').and.returnValue(null);
      spyOn(view['argElementsBridge_'], 'set');
      spyOn(view['argInputBridge_'], 'delete');

      view['onArgInputValueChange_'](newValue);

      assert(view['argInputBridge_'].delete).to.haveBeenCalledWith();
      assert(view['argElementsBridge_'].set).to.haveBeenCalledWith([newArg1, newArg2]);
    });

    it('should do nothing if there are no commas in the input element', () => {
      let newValue = 'newValue';

      spyOn(view['argElementsBridge_'], 'set');
      spyOn(view['argInputBridge_'], 'delete');

      view['onArgInputValueChange_'](newValue);

      assert(view['argInputBridge_'].delete).toNot.haveBeenCalled();
      assert(view['argElementsBridge_'].set).toNot.haveBeenCalled();
    });

    it('should do nothing if the new input value is null', () => {
      spyOn(view['argElementsBridge_'], 'set');
      spyOn(view['argInputBridge_'], 'delete');

      view['onArgInputValueChange_'](null);

      assert(view['argInputBridge_'].delete).toNot.haveBeenCalled();
      assert(view['argElementsBridge_'].set).toNot.haveBeenCalled();
    });
  });

  describe('onAssetChanged_', () => {
    it('should update the UI elements for asset and helper', (done: any) => {
      let currentHelperId = 'currentHelperId';

      let mockHelper = jasmine.createSpyObj('Helper', ['getArgs', 'getBody', 'getId', 'getName']);
      mockHelper.getId.and.returnValue(currentHelperId);
      spyOn(view, 'getHelper_').and.returnValue(Promise.resolve(mockHelper));

      let helperId1 = 'helperId1';
      let mockHelper1 = jasmine.createSpyObj('Helper1', ['getId']);
      mockHelper1.getId.and.returnValue(helperId1);

      let helperId2 = 'helperId2';
      let mockHelper2 = jasmine.createSpyObj('Helper2', ['getId']);
      mockHelper2.getId.and.returnValue(helperId2);

      let assetId = 'assetId';
      let projectId = 'projectId';
      let mockAsset = jasmine.createSpyObj('Asset', ['getAllHelpers', 'getId', 'getProjectId']);
      mockAsset.getAllHelpers.and.returnValue([mockHelper1, mockHelper2, mockHelper]);
      mockAsset.getId.and.returnValue(assetId);
      mockAsset.getProjectId.and.returnValue(projectId);

      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));
      spyOn(view, 'updateHelper_');
      spyOn(view['helperItemsBridge_'], 'set');

      view['onAssetChanged_'](mockAsset)
          .then(() => {
            assert(view['helperItemsBridge_'].set).to.haveBeenCalledWith([
              {assetId, helperId: currentHelperId, projectId},
              {assetId, helperId: helperId1, projectId},
              {assetId, helperId: helperId2, projectId},
            ]);
            assert(view['updateHelper_']).to.haveBeenCalledWith(mockHelper);
            done();
          }, done.fail);
    });

    it('should pick the first helper if there are no helpers selected', (done: any) => {
      spyOn(view, 'getHelper_').and.returnValue(Promise.resolve(null));

      let helperId1 = 'helperId1';
      let mockHelper1 = jasmine.createSpyObj('Helper1', ['getId']);
      mockHelper1.getId.and.returnValue(helperId1);

      let helperId2 = 'helperId2';
      let mockHelper2 = jasmine.createSpyObj('Helper2', ['getId']);
      mockHelper2.getId.and.returnValue(helperId2);

      let assetId = 'assetId';
      let projectId = 'projectId';
      let mockAsset = jasmine.createSpyObj('Asset', ['getAllHelpers', 'getId', 'getProjectId']);
      mockAsset.getAllHelpers.and.returnValue([mockHelper1, mockHelper2]);
      mockAsset.getId.and.returnValue(assetId);
      mockAsset.getProjectId.and.returnValue(projectId);

      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));
      spyOn(view, 'updateHelper_');

      let helperFactoryService = Mocks.object('helperFactoryService');
      mockRouteFactoryService.helper.and.returnValue(helperFactoryService);

      view['onAssetChanged_'](mockAsset)
          .then(() => {
            assert(mockRouteService.goTo).to.haveBeenCalledWith(
                helperFactoryService,
                {assetId, helperId: helperId1, projectId});
            assert(view['updateHelper_']).toNot.haveBeenCalled();
            done();
          }, done.fail);
    });

    it('should create a new helper if there are no helpers in the asset', (done: any) => {
      spyOn(view, 'getHelper_').and.returnValue(Promise.resolve(null));

      let mockAsset = jasmine.createSpyObj('Asset', ['getAllHelpers']);
      mockAsset.getAllHelpers.and.returnValue([]);

      spyOn(view, 'createHelper_').and.returnValue(Promise.resolve());
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));
      spyOn(view, 'updateHelper_');

      let helperFactoryService = Mocks.object('helperFactoryService');
      mockRouteFactoryService.helper.and.returnValue(helperFactoryService);

      view['onAssetChanged_'](mockAsset)
          .then(() => {
            assert(view['createHelper_']).to.haveBeenCalledWith(mockAsset);
            assert(view['updateHelper_']).toNot.haveBeenCalled();
            done();
          }, done.fail);
    });
  });

  describe('onChanges_', () => {
    it('should update the helper and the asset correctly', (done: any) => {
      let args = Mocks.object('args');
      spyOn(view['argElementsBridge_'], 'get').and.returnValue(args);

      let body = 'body';
      spyOn(view['bodyInputBridge_'], 'get').and.returnValue(body);

      let helperId = 'helperId';
      let mockHelper = jasmine.createSpyObj('Helper', ['getId', 'setArgs', 'setBody', 'setName']);
      mockHelper.getId.and.returnValue(helperId);
      spyOn(view, 'getHelper_').and.returnValue(Promise.resolve(mockHelper));

      let mockAsset = jasmine.createSpyObj('Asset', ['setHelper']);
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(mockAsset));

      view['onChanges_']()
          .then(() => {
            assert(mockAssetCollection.update).to.haveBeenCalledWith(mockAsset);
            assert(mockAsset.setHelper).to.haveBeenCalledWith(helperId, mockHelper);
            assert(mockHelper.setBody).to.haveBeenCalledWith(body);
            assert(mockHelper.setArgs).to.haveBeenCalledWith(args);
            done();
          }, done.fail);
    });

    it('should do nothing if the helper cannot be found', (done: any) => {
      let args = Mocks.object('args');
      spyOn(view['argElementsBridge_'], 'get').and.returnValue(args);

      let body = 'body';
      spyOn(view['bodyInputBridge_'], 'get').and.returnValue(body);

      spyOn(view, 'getHelper_').and.returnValue(Promise.resolve(null));
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(Mocks.object('asset')));

      view['onChanges_']()
          .then(() => {
            assert(mockAssetCollection.update).toNot.haveBeenCalled();
            done();
          }, done.fail);
    });

    it('should do nothing if the asset cannot be found', (done: any) => {
      let args = Mocks.object('args');
      spyOn(view['argElementsBridge_'], 'get').and.returnValue(args);

      let body = 'body';
      spyOn(view['bodyInputBridge_'], 'get').and.returnValue(body);

      spyOn(view, 'getHelper_').and.returnValue(Promise.resolve(Mocks.object('helper')));
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(null));

      view['onChanges_']()
          .then(() => {
            assert(mockAssetCollection.update).toNot.haveBeenCalled();
            done();
          }, done.fail);
    });

    it('should do nothing if args is null', (done: any) => {
      spyOn(view['argElementsBridge_'], 'get').and.returnValue(null);

      let body = 'body';
      spyOn(view['bodyInputBridge_'], 'get').and.returnValue(body);

      spyOn(view, 'getHelper_').and.returnValue(Promise.resolve(Mocks.object('helper')));
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(Mocks.object('asset')));

      view['onChanges_']()
          .then(() => {
            assert(mockAssetCollection.update).toNot.haveBeenCalled();
            done();
          }, done.fail);
    });

    it('should do nothing if body is null', (done: any) => {
      let args = Mocks.object('args');
      spyOn(view['argElementsBridge_'], 'get').and.returnValue(args);
      spyOn(view['bodyInputBridge_'], 'get').and.returnValue(null);

      spyOn(view, 'getHelper_').and.returnValue(Promise.resolve(Mocks.object('helper')));
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(Mocks.object('asset')));

      view['onChanges_']()
          .then(() => {
            assert(mockAssetCollection.update).toNot.haveBeenCalled();
            done();
          }, done.fail);
    });
  });

  describe('onCreateButtonClick_', () => {
    it('should call creaateHelper_ correctly', (done: any) => {
      let asset = Mocks.object('asset');
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(asset));
      spyOn(view, 'createHelper_');
      view['onCreateButtonClick_']()
          .then(() => {
            assert(view['createHelper_']).to.haveBeenCalledWith(asset);
            done();
          }, done.fail);
    });

    it('should do nothing if there are no assets', (done: any) => {
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(null));
      spyOn(view, 'createHelper_');
      view['onCreateButtonClick_']()
          .then(() => {
            assert(view['createHelper_']).toNot.haveBeenCalled();
            done();
          }, done.fail);
    });
  });

  describe('onExecuteButtonClick_', () => {
    it('should execute the code, update the console, and scroll to the bottom of the console',
        (done: any) => {
          let asset = Mocks.object('asset');
          spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(asset));

          let command = 'command';
          spyOn(view['consoleInputBridge_'], 'get').and.returnValue(command);

          let entry1 = Mocks.object('entry1');
          let entry2 = Mocks.object('entry2');
          spyOn(view['consoleEntryBridge_'], 'get').and.returnValue([entry1, entry2]);
          spyOn(view['consoleEntryBridge_'], 'set');

          let result = 'result';
          let mockCompiledDelegate = jasmine.createSpy('CompiledDelegate');
          mockCompiledDelegate.and.returnValue(result);

          let mockCompiler = jasmine.createSpyObj('Compiler', ['compile']);
          mockCompiler.compile.and.returnValue(mockCompiledDelegate);
          mockTemplateCompilerService.create.and.returnValue(mockCompiler);

          let scrollHeight = 123;
          let containerEl = Mocks.object('containerEl');
          containerEl.scrollHeight = scrollHeight;

          let mockShadowRoot = jasmine.createSpyObj('ShadowRoot', ['querySelector']);
          mockShadowRoot.querySelector.and.returnValue(containerEl);

          let element = Mocks.object('element');
          element.shadowRoot = mockShadowRoot;
          let mockListenable = jasmine.createSpyObj('Listenable', ['getEventTarget']);
          mockListenable.getEventTarget.and.returnValue(element);
          spyOn(view, 'getElement').and.returnValue(mockListenable);

          view['onExecuteButtonClick_']()
              .then(() => {
                assert(containerEl.scrollTop).to.equal(scrollHeight);
                assert(mockShadowRoot.querySelector).to.haveBeenCalledWith('#consoleContainer');
                assert(view['consoleEntryBridge_'].set).to.haveBeenCalledWith([
                  entry1,
                  entry2,
                  {command, isError: false, result},
                ]);
                assert(mockCompiler.compile).to.haveBeenCalledWith(command);
                assert(mockTemplateCompilerService.create).to.haveBeenCalledWith(asset);
                done();
              }, done.fail);
        });

    it('should handle error thrown during compile step correctly', (done: any) => {
      let asset = Mocks.object('asset');
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(asset));

      let command = 'command';
      spyOn(view['consoleInputBridge_'], 'get').and.returnValue(command);

      let entry1 = Mocks.object('entry1');
      let entry2 = Mocks.object('entry2');
      spyOn(view['consoleEntryBridge_'], 'get').and.returnValue([entry1, entry2]);
      spyOn(view['consoleEntryBridge_'], 'set');

      let message = 'message';
      let stack = 'stack';
      let error = {message, stack};
      Object.setPrototypeOf(error, Error.prototype);
      let mockCompiler = jasmine.createSpyObj('Compiler', ['compile']);
      mockCompiler.compile.and.throwError(error);
      mockTemplateCompilerService.create.and.returnValue(mockCompiler);

      let scrollHeight = 123;
      let containerEl = Mocks.object('containerEl');
      containerEl.scrollHeight = scrollHeight;

      let mockShadowRoot = jasmine.createSpyObj('ShadowRoot', ['querySelector']);
      mockShadowRoot.querySelector.and.returnValue(containerEl);

      let element = Mocks.object('element');
      element.shadowRoot = mockShadowRoot;
      let mockListenable = jasmine.createSpyObj('Listenable', ['getEventTarget']);
      mockListenable.getEventTarget.and.returnValue(element);
      spyOn(view, 'getElement').and.returnValue(mockListenable);

      view['onExecuteButtonClick_']()
          .then(() => {
            assert(containerEl.scrollTop).to.equal(scrollHeight);
            assert(mockShadowRoot.querySelector).to.haveBeenCalledWith('#consoleContainer');
            assert(view['consoleEntryBridge_'].set).to.haveBeenCalledWith([
              entry1,
              entry2,
              {command, isError: true, result: `${message}\n\n${stack}`},
            ]);
            assert(mockCompiler.compile).to.haveBeenCalledWith(command);
            assert(mockTemplateCompilerService.create).to.haveBeenCalledWith(asset);
            done();
          }, done.fail);
    });

    it('should not scroll to the bottom if the element cannot be found', (done: any) => {
      let asset = Mocks.object('asset');
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(asset));

      let command = 'command';
      spyOn(view['consoleInputBridge_'], 'get').and.returnValue(command);

      let entry1 = Mocks.object('entry1');
      let entry2 = Mocks.object('entry2');
      spyOn(view['consoleEntryBridge_'], 'get').and.returnValue([entry1, entry2]);
      spyOn(view['consoleEntryBridge_'], 'set');

      let message = 'message';
      let stack = 'stack';
      let error = {message, stack};
      Object.setPrototypeOf(error, Error.prototype);
      let mockCompiler = jasmine.createSpyObj('Compiler', ['compile']);
      mockCompiler.compile.and.throwError(error);
      mockTemplateCompilerService.create.and.returnValue(mockCompiler);

      spyOn(view, 'getElement').and.returnValue(null);

      view['onExecuteButtonClick_']()
          .then(() => {
            assert(view['consoleEntryBridge_'].set).to.haveBeenCalledWith([
              entry1,
              entry2,
              {command, isError: true, result: `${message}\n\n${stack}`},
            ]);
            assert(mockCompiler.compile).to.haveBeenCalledWith(command);
            assert(mockTemplateCompilerService.create).to.haveBeenCalledWith(asset);
            done();
          }, done.fail);
    });

    it('should do nothing if the compiler cannot be created', (done: any) => {
      let asset = Mocks.object('asset');
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(asset));

      let command = 'command';
      spyOn(view['consoleInputBridge_'], 'get').and.returnValue(command);
      spyOn(view['consoleEntryBridge_'], 'set');

      mockTemplateCompilerService.create.and.returnValue(null);

      view['onExecuteButtonClick_']()
          .then(() => {
            assert(view['consoleEntryBridge_'].set).toNot.haveBeenCalled();
            assert(mockTemplateCompilerService.create).to.haveBeenCalledWith(asset);
            done();
          }, done.fail);
    });

    it('should do nothing if asset cannot be found', (done: any) => {
      spyOn(view, 'getAsset_').and.returnValue(Promise.resolve(null));

      let command = 'command';
      spyOn(view['consoleInputBridge_'], 'get').and.returnValue(command);
      spyOn(view['consoleEntryBridge_'], 'set');

      mockTemplateCompilerService.create.and.returnValue(null);

      view['onExecuteButtonClick_']()
          .then(() => {
            assert(view['consoleEntryBridge_'].set).toNot.haveBeenCalled();
            assert(mockTemplateCompilerService.create).toNot.haveBeenCalled();
            done();
          }, done.fail);
    });

    it('should do nothing if the console has no values', (done: any) => {
      spyOn(view['consoleInputBridge_'], 'get').and.returnValue(null);
      spyOn(view['consoleEntryBridge_'], 'set');

      mockTemplateCompilerService.create.and.returnValue(null);

      view['onExecuteButtonClick_']()
          .then(() => {
            assert(view['consoleEntryBridge_'].set).toNot.haveBeenCalled();
            assert(mockTemplateCompilerService.create).toNot.haveBeenCalled();
            done();
          }, done.fail);
    });
  });

  describe('onHelperChanged_', () => {
    it('should update the name, argElements, and body input', () => {
      let name = 'name';
      let args = Mocks.object('args');
      let body = 'body';
      let mockHelper = jasmine.createSpyObj('Helper', ['getArgs', 'getBody', 'getName']);
      mockHelper.getArgs.and.returnValue(args);
      mockHelper.getBody.and.returnValue(body);
      mockHelper.getName.and.returnValue(name);

      spyOn(view['nameBridge_'], 'set');
      spyOn(view['argElementsBridge_'], 'set');
      spyOn(view['bodyInputBridge_'], 'set');

      view['onHelperChanged_'](mockHelper);

      assert(view['nameBridge_'].set).to.haveBeenCalledWith(name);
      assert(view['argElementsBridge_'].set).to.haveBeenCalledWith(args);
      assert(view['bodyInputBridge_'].set).to.haveBeenCalledWith(body);
    });
  });

  describe('onRouteChanged_', () => {
    it('should call onActiveChange_ with true if the view is active', () => {
      spyOn(view, 'onActiveChange_');
      mockRouteService.getParams.and.returnValue({});

      let helperFactory = Mocks.object('helperFactory');
      mockRouteFactoryService.helper.and.returnValue(helperFactory);

      view['onRouteChanged_']();

      assert(view['onActiveChange_']).to.haveBeenCalledWith(true);
      assert(mockRouteService.getParams).to.haveBeenCalledWith(helperFactory);
    });

    it('should call onActiveChange_ with false if the view is inactive', () => {
      spyOn(view, 'onActiveChange_');
      mockRouteService.getParams.and.returnValue(null);

      let helperFactory = Mocks.object('helperFactory');
      mockRouteFactoryService.helper.and.returnValue(helperFactory);

      view['onRouteChanged_']();

      assert(view['onActiveChange_']).to.haveBeenCalledWith(false);
      assert(mockRouteService.getParams).to.haveBeenCalledWith(helperFactory);
    });
  });

  describe('updateAsset_', () => {
    it('should dispose the previous deregister and listen to changed event', () => {
      let mockDeregister = jasmine.createSpyObj('Deregister', ['dispose']);
      view['assetUpdateDeregister_'] = mockDeregister;

      let mockNewDeregister = jasmine.createSpyObj('NewDeregister', ['dispose']);
      let mockAsset = jasmine.createSpyObj('Asset', ['on']);
      mockAsset.on.and.returnValue(mockNewDeregister);

      let assetChangedSpy = spyOn(view, 'onAssetChanged_');

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

      let mockNewDeregister = jasmine.createSpyObj('NewDeregister', ['dispose']);
      let mockAsset = jasmine.createSpyObj('Asset', ['on']);
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
      let mockDeregister = jasmine.createSpyObj('Deregister', ['dispose']);
      view['helperUpdateDeregister_'] = mockDeregister;

      let mockNewDeregister = jasmine.createSpyObj('NewDeregister', ['dispose']);
      let mockHelper = jasmine.createSpyObj('Helper', ['on']);
      mockHelper.on.and.returnValue(mockNewDeregister);

      let helperChangedSpy = spyOn(view, 'onHelperChanged_');

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

      let mockNewDeregister = jasmine.createSpyObj('NewDeregister', ['dispose']);
      let mockHelper = jasmine.createSpyObj('Helper', ['on']);
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
      let mockAssetUpdateDeregister = jasmine.createSpyObj('AssetUpdateDeregister', ['dispose']);
      view['assetUpdateDeregister_'] = mockAssetUpdateDeregister;

      let mockHelperUpdateDeregister = jasmine.createSpyObj('HelperUpdateDeregister', ['dispose']);
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
      let arg1 = 'arg1';
      let arg2 = 'arg2';
      let arg3 = 'arg3';
      spyOn(view['argElementsBridge_'], 'get').and.returnValue([arg1, arg2, arg3]);
      spyOn(view['argElementsBridge_'], 'set');

      let child1 = document.createElement('child1');
      let child2 = document.createElement('child2');
      let child3 = document.createElement('child3');
      let rootEl = document.createElement('root');
      rootEl.appendChild(child1);
      rootEl.appendChild(child2);
      rootEl.appendChild(child3);

      view.onArgClick(<Event> <any> {target: child2});

      assert(view['argElementsBridge_'].set).to.haveBeenCalledWith([arg1, arg3]);
    });

    it('should do nothing if there are no args', () => {
      spyOn(view['argElementsBridge_'], 'get').and.returnValue(null);
      spyOn(view['argElementsBridge_'], 'set');

      view.onArgClick(<Event> <any> {target: document.createElement('child')});

      assert(view['argElementsBridge_'].set).toNot.haveBeenCalled();
    });

    it('should do nothing if the event target is not an element', () => {
      spyOn(view['argElementsBridge_'], 'set');

      view.onArgClick(<Event> <any> {target: {}});

      assert(view['argElementsBridge_'].set).toNot.haveBeenCalled();
    });
  });

  describe('onCreated', () => {
    it('should listen to route service changed event', () => {
      let mockDeregister = jasmine.createSpyObj('Deregister', ['dispose']);
      mockRouteService.on.and.returnValue(mockDeregister);

      spyOn(view, 'addDisposable').and.callThrough();
      spyOn(view, 'onRouteChanged_');

      let element = Mocks.object('element');
      view.onCreated(element);
      assert(view.addDisposable).to.haveBeenCalledWith(mockDeregister);
      assert(mockRouteService.on).to
          .haveBeenCalledWith(RouteServiceEvents.CHANGED, view['onRouteChanged_'], view);
      assert(view['onRouteChanged_']).to.haveBeenCalledWith();
    });
  });
});
