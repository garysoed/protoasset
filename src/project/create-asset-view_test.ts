import {assert, Matchers, TestBase} from '../test-base';
TestBase.setup();

import {Mocks} from 'external/gs_tools/src/mock';
import {TestDispose} from 'external/gs_tools/src/testing';

import {Asset} from '../data/asset';
import {CreateAssetView} from './create-asset-view';


describe('project.CreateAssetView', () => {
  let mockAssetCollection;
  let mockRouteFactoryService;
  let mockRouteService;
  let view: CreateAssetView;

  beforeEach(() => {
    mockAssetCollection = jasmine.createSpyObj('AssetCollection', ['reserveId', 'update']);
    mockRouteFactoryService = jasmine.createSpyObj('RouteFactoryService', ['project']);
    mockRouteService = jasmine.createSpyObj('RouteService', ['getParams', 'goTo']);
    view = new CreateAssetView(
        Mocks.object('ThemeService'),
        mockAssetCollection,
        mockRouteFactoryService,
        mockRouteService);
    TestDispose.add(view);
  });

  describe('getProjectId_', () => {
    it('should return the correct project ID', () => {
      let projectId = 'projectId';

      let routeFactory = Mocks.object('routeFactory');
      mockRouteFactoryService.project.and.returnValue(routeFactory);

      mockRouteService.getParams.and.returnValue({projectId: projectId});

      assert(view['getProjectId_']()).to.equal(projectId);
      assert(mockRouteService.getParams).to.haveBeenCalledWith(routeFactory);
    });

    it('should return null if there are no matches', () => {
      let routeFactory = Mocks.object('routeFactory');
      mockRouteFactoryService.project.and.returnValue(routeFactory);

      mockRouteService.getParams.and.returnValue(null);

      assert(view['getProjectId_']()).to.beNull();
      assert(mockRouteService.getParams).to.haveBeenCalledWith(routeFactory);
    });
  });

  describe('reset_', () => {
    it('should reset all values', () => {
      spyOn(view['nameValueBridge_'], 'set');
      view['reset_']();
      assert(view['nameValueBridge_'].set).to.haveBeenCalledWith('');
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
    it('should enable the create button if the name is filled', () => {
      spyOn(view['createButtonDisabledBridge_'], 'set');
      spyOn(view['nameValueBridge_'], 'get').and.returnValue('name');

      view['onNameChange_']();

      assert(view['createButtonDisabledBridge_'].set).to.haveBeenCalledWith(false);
    });

    it('should disable the create button if there are no names', () => {
      spyOn(view['createButtonDisabledBridge_'], 'set');
      spyOn(view['nameValueBridge_'], 'get').and.returnValue(null);

      view['onNameChange_']();

      assert(view['createButtonDisabledBridge_'].set).to.haveBeenCalledWith(true);
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
  });
});
