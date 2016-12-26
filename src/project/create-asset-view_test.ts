import {assert, Matchers, TestBase} from '../test-base';
TestBase.setup();

import {DomEvent, ListenableDom} from 'external/gs_tools/src/event';
import {Mocks} from 'external/gs_tools/src/mock';
import {TestDispose} from 'external/gs_tools/src/testing';

import {Asset, AssetTypes} from '../data/asset';
import {
  assetTypeMenuDataSetter,
  assetTypeMenuGenerator,
  CreateAssetView} from './create-asset-view';


describe('project.CreateAssetView', () => {
  let mockAssetCollection;
  let mockRouteFactoryService;
  let mockRouteService;
  let view: CreateAssetView;

  beforeEach(() => {
    mockAssetCollection = jasmine.createSpyObj('AssetCollection', ['reserveId', 'update']);
    mockRouteFactoryService =
        jasmine.createSpyObj('RouteFactoryService', ['createAsset', 'project']);
    mockRouteService = jasmine.createSpyObj('RouteService', ['getParams', 'goTo']);
    view = new CreateAssetView(
        Mocks.object('ThemeService'),
        mockAssetCollection,
        mockRouteFactoryService,
        mockRouteService);
    TestDispose.add(view);
  });

  describe('assetTypeMenuGenerator', () => {
    it('should create the element correctly and listen to the click event', () => {
      let mockListenableElement = Mocks.listenable('ListenableElement');
      spyOn(mockListenableElement, 'on').and.callThrough();
      TestDispose.add(mockListenableElement);
      spyOn(ListenableDom, 'of').and.returnValue(mockListenableElement);

      let element = Mocks.object('element');
      let mockDocument = jasmine.createSpyObj('Document', ['createElement']);
      mockDocument.createElement.and.returnValue(element);

      assert(assetTypeMenuGenerator(mockDocument, view)).to.equal(element);
      assert(mockListenableElement.on).to
          .haveBeenCalledWith(DomEvent.CLICK, view.onTypeClicked, view);
      assert(ListenableDom.of).to.haveBeenCalledWith(element);
      assert(mockDocument.createElement).to.haveBeenCalledWith('pa-asset-type-item');
    });
  });

  describe('assetTypeMenuDataSetter', () => {
    it('should set the attribute correctly', () => {
      let mockElement = jasmine.createSpyObj('Element', ['setAttribute']);

      assetTypeMenuDataSetter(AssetTypes.CARD, mockElement);

      assert(mockElement.setAttribute).to.haveBeenCalledWith('pa-data', 'card');
    });
  });

  describe('getProjectId_', () => {
    it('should return the correct project ID', () => {
      let projectId = 'projectId';

      let routeFactory = Mocks.object('routeFactory');
      mockRouteFactoryService.createAsset.and.returnValue(routeFactory);

      mockRouteService.getParams.and.returnValue({projectId: projectId});

      assert(view['getProjectId_']()).to.equal(projectId);
      assert(mockRouteService.getParams).to.haveBeenCalledWith(routeFactory);
    });

    it('should return null if there are no matches', () => {
      let routeFactory = Mocks.object('routeFactory');
      mockRouteFactoryService.createAsset.and.returnValue(routeFactory);

      mockRouteService.getParams.and.returnValue(null);

      assert(view['getProjectId_']()).to.beNull();
      assert(mockRouteService.getParams).to.haveBeenCalledWith(routeFactory);
    });
  });

  describe('reset_', () => {
    it('should reset all values', () => {
      spyOn(view, 'setAssetType_');
      spyOn(view['nameValueBridge_'], 'set');
      view['reset_']();
      assert(view['nameValueBridge_'].set).to.haveBeenCalledWith('');
      assert(view['setAssetType_']).to.haveBeenCalledWith(null);
    });
  });

  describe('setAssetType_', () => {
    it('should set the bridge correctly if the type is non null', () => {
      let renderedType = 'renderedType';
      spyOn(Asset, 'renderType').and.returnValue(renderedType);

      let assetType = Mocks.object('assetType');

      spyOn(view, 'verifyInput_');
      spyOn(view['assetTypeBridge_'], 'set');

      view['setAssetType_'](assetType);

      assert(view['verifyInput_']).to.haveBeenCalledWith();
      assert(view['assetTypeBridge_'].set).to.haveBeenCalledWith(renderedType);
      assert(Asset.renderType).to.haveBeenCalledWith(assetType);
    });

    it('should set the bridge correctly if the type is null', () => {
      spyOn(view, 'verifyInput_');
      spyOn(view['assetTypeBridge_'], 'set');

      view['setAssetType_'](null);

      assert(view['verifyInput_']).to.haveBeenCalledWith();
      assert(view['assetTypeBridge_'].set).to
          .haveBeenCalledWith(Matchers.stringMatching(/Select a type/));
    });
  });

  describe('verifyInput_', () => {
    it('should enable the create button if the name and asset type are set', () => {
      spyOn(view['createButtonDisabledBridge_'], 'set');
      spyOn(view['nameValueBridge_'], 'get').and.returnValue('name');
      view['assetType_'] = Mocks.object('assetType');

      view['verifyInput_']();

      assert(view['createButtonDisabledBridge_'].set).to.haveBeenCalledWith(false);
    });

    it('should disable the create button if the name is not set', () => {
      spyOn(view['createButtonDisabledBridge_'], 'set');
      spyOn(view['nameValueBridge_'], 'get').and.returnValue(null);
      view['assetType_'] = Mocks.object('assetType');

      view['verifyInput_']();

      assert(view['createButtonDisabledBridge_'].set).to.haveBeenCalledWith(true);
    });

    it('should disable the create button if the asset type is not set', () => {
      spyOn(view['createButtonDisabledBridge_'], 'set');
      spyOn(view['nameValueBridge_'], 'get').and.returnValue('name');
      view['assetType_'] = null;

      view['verifyInput_']();

      assert(view['createButtonDisabledBridge_'].set).to.haveBeenCalledWith(true);
    });
  });

  describe('onCancelAction_', () => {
    it('should reset the form and go to the project main view', () => {
      let routeFactory = Mocks.object('routeFactory');
      mockRouteFactoryService.project.and.returnValue(routeFactory);

      let projectId = 'projectId';
      spyOn(view, 'reset_');
      spyOn(view, 'getProjectId_').and.returnValue(projectId);

      view['onCancelAction_']();

      assert(mockRouteService.goTo).to.haveBeenCalledWith(routeFactory, {projectId: projectId});
      assert(view['reset_']).to.haveBeenCalledWith();
    });

    it('should do nothing if there are no project IDs', () => {
      spyOn(view, 'reset_');
      spyOn(view, 'getProjectId_').and.returnValue(null);

      view['onCancelAction_']();

      assert(mockRouteService.goTo).toNot.haveBeenCalled();
      assert(view['reset_']).toNot.haveBeenCalled();
    });
  });

  describe('onNameChange_', () => {
    it('should verify the input', () => {
      spyOn(view, 'verifyInput_');

      view['onNameChange_']();

      assert(view['verifyInput_']).to.haveBeenCalledWith();
    });
  });

  describe('onSubmitAction_', () => {
    it('should create the asset correctly and navigate to the project main view', (done: any) => {
      let routeFactory = Mocks.object('routeFactory');
      mockRouteFactoryService.project.and.returnValue(routeFactory);

      let projectId = 'projectId';
      spyOn(view, 'getProjectId_').and.returnValue(projectId);

      spyOn(view, 'reset_');

      let assetName = 'assetName';
      spyOn(view['nameValueBridge_'], 'get').and.returnValue(assetName);

      let assetType = Mocks.object('assetType');
      view['assetType_'] = assetType;

      let assetId = 'assetId';
      mockAssetCollection.reserveId.and.returnValue(Promise.resolve(assetId));

      view['onSubmitAction_']()
          .then(() => {
            assert(mockRouteService.goTo).to
                .haveBeenCalledWith(routeFactory, {projectId: projectId});
            assert(view['reset_']).to.haveBeenCalledWith();

            assert(mockAssetCollection.update).to
                .haveBeenCalledWith(Matchers.any(Asset), projectId);
            let asset = mockAssetCollection.update.calls.argsFor(0)[0];
            assert(asset.getName()).to.equal(assetName);
            assert(asset.getType()).to.equal(assetType);
            assert(asset.getId()).to.equal(assetId);

            assert(mockAssetCollection.reserveId).to.haveBeenCalledWith(projectId);
            done();
          }, done.fail);
    });

    it('should do nothing if there are no project IDs', (done: any) => {
      spyOn(view, 'getProjectId_').and.returnValue(null);

      spyOn(view, 'reset_');

      let assetName = 'assetName';
      spyOn(view['nameValueBridge_'], 'get').and.returnValue(assetName);

      view['assetType_'] = Mocks.object('assetType');

      view['onSubmitAction_']()
          .then(() => {
            assert(mockRouteService.goTo).toNot.haveBeenCalled();
            assert(view['reset_']).toNot.haveBeenCalled();

            assert(mockAssetCollection.update).toNot.haveBeenCalled();
            done();
          }, done.fail);
    });

    it('should throw error if project name is not set', () => {
      spyOn(view['nameValueBridge_'], 'get').and.returnValue(null);

      assert(() => {
        view['onSubmitAction_']();
      }).to.throwError(/Project name/);
    });

    it('should throw error if the asset type is not set', () => {
      let assetName = 'assetName';
      spyOn(view['nameValueBridge_'], 'get').and.returnValue(assetName);

      view['assetType_'] = null;

      assert(() => {
        view['onSubmitAction_']();
      }).to.throwError(/Asset type/);
    });
  });

  describe('onTypeClicked', () => {
    it('should set the type correctly', () => {
      let stringType = 'card';
      let mockTarget = jasmine.createSpyObj('Target', ['getAttribute']);
      mockTarget.getAttribute.and.returnValue(stringType);

      spyOn(view, 'setAssetType_');

      view.onTypeClicked(<any> {target: mockTarget});

      assert(view['setAssetType_']).to.haveBeenCalledWith(AssetTypes.CARD);
      assert(mockTarget.getAttribute).to.haveBeenCalledWith('pa-data');
    });
  });
});
