import {assert, TestBase} from '../test-base';
TestBase.setup();

import {Mocks} from 'external/gs_tools/src/mock';
import {TestDispose} from 'external/gs_tools/src/testing';

import {RouteServiceEvents} from 'external/gs_ui/src/routing';

import {AssetListView} from './asset-list-view';


describe('project.AssetListView', () => {
  let mockAssetCollection;
  let mockProjectCollection;
  let mockRouteFactoryService;
  let mockRouteService;
  let view: AssetListView;

  beforeEach(() => {
    mockAssetCollection = jasmine.createSpyObj('AssetCollection', ['list']);
    mockProjectCollection = jasmine.createSpyObj('ProjectCollection', ['get']);
    mockRouteFactoryService =
        jasmine.createSpyObj('RouteFactoryService', ['assetList', 'createAsset']);
    mockRouteService = Mocks.listenable('RouteService');
    mockRouteService.getParams = jasmine.createSpy('RouteService.getParams');
    mockRouteService.goTo = jasmine.createSpy('RouteService.goTo');
    TestDispose.add(mockRouteService);

    view = new AssetListView(
        mockAssetCollection,
        mockProjectCollection,
        mockRouteFactoryService,
        mockRouteService,
        jasmine.createSpyObj('ThemeService', ['applyTheme']));
    TestDispose.add(view);
  });

  describe('getProjectId_', () => {
    it('should return the correct project ID if there is a match', () => {
      let projectId = 'projectId';

      let routeFactory = Mocks.object('routeFactory');
      mockRouteFactoryService.assetList.and.returnValue(routeFactory);

      mockRouteService.getParams.and.returnValue({projectId: projectId});

      assert(view['getProjectId_']()).to.equal(projectId);
      assert(mockRouteService.getParams).to.haveBeenCalledWith(routeFactory);
    });

    it('should return null if there are no project IDs', () => {
      let routeFactory = Mocks.object('routeFactory');
      mockRouteFactoryService.assetList.and.returnValue(routeFactory);

      mockRouteService.getParams.and.returnValue(null);

      assert(view['getProjectId_']()).to.beNull();
      assert(mockRouteService.getParams).to.haveBeenCalledWith(routeFactory);
    });
  });

  describe('onProjectIdChanged_', () => {
    it('should update the project name corretly if there are matches', async (done: any) => {
      let projectId = 'projectId';
      let projectName = 'projectName';

      let mockProject = jasmine.createSpyObj('Project', ['getName']);
      mockProject.getName.and.returnValue(projectName);

      mockAssetCollection.list.and.returnValue(Promise.resolve());
      mockProjectCollection.get.and.returnValue(Promise.resolve(mockProject));

      spyOn(view, 'getProjectId_').and.returnValue(projectId);
      spyOn(view['assetsBridge_'], 'set');
      spyOn(view['projectNameTextBridge_'], 'set');

      await view['onProjectIdChanged_']();
      assert(view['projectNameTextBridge_'].set).to.haveBeenCalledWith(projectName);
      assert(mockProjectCollection.get).to.haveBeenCalledWith(projectId);
    });

    it('should set the assets', async (done: any) => {
      let projectId = 'projectId';
      let assets = Mocks.object('assets');

      mockAssetCollection.list.and.returnValue(Promise.resolve(assets));
      mockProjectCollection.get.and.returnValue(Promise.resolve(null));

      spyOn(view, 'getProjectId_').and.returnValue(projectId);
      spyOn(view['assetsBridge_'], 'set');
      spyOn(view['projectNameTextBridge_'], 'set');

      await view['onProjectIdChanged_']();
      assert(view['assetsBridge_'].set).to.haveBeenCalledWith(assets);
      assert(mockAssetCollection.list).to.haveBeenCalledWith(projectId);
    });

    it('should not throw error if there are no projects corresponding to the project ID',
        async (done: any) => {
          let projectId = 'projectId';

          mockAssetCollection.list.and.returnValue(Promise.resolve());
          mockProjectCollection.get.and.returnValue(Promise.resolve(null));
          spyOn(view, 'getProjectId_').and.returnValue(projectId);
          spyOn(view['assetsBridge_'], 'set');
          spyOn(view['projectNameTextBridge_'], 'set');

          await view['onProjectIdChanged_']();
          assert(view['projectNameTextBridge_'].set).toNot.haveBeenCalled();
        });

    it('should not throw error if there are no project IDs', async (done: any) => {
      spyOn(view, 'getProjectId_').and.returnValue(null);
      spyOn(view['projectNameTextBridge_'], 'set');

      await view['onProjectIdChanged_']();
      assert(view['projectNameTextBridge_'].set).toNot.haveBeenCalled();
    });
  });

  describe('onCreateButtonClicked_', () => {
    it('should navigate to create asset view', () => {
      let projectId = 'projectId';
      spyOn(view, 'getProjectId_').and.returnValue(projectId);

      let routeFactory = Mocks.object('routeFactory');
      mockRouteFactoryService.createAsset.and.returnValue(routeFactory);

      view['onCreateButtonClicked_']();

      assert(mockRouteService.goTo).to.haveBeenCalledWith(routeFactory, {projectId: projectId});
    });

    it('should not throw error if there are no project IDs', () => {
      spyOn(view, 'getProjectId_').and.returnValue(null);
      assert(() => {
        view['onCreateButtonClicked_']();
      }).toNot.throw();
    });
  });

  describe('onCreated', () => {
    it('should update the project name and listen to changes to route', () => {
      spyOn(view, 'onProjectIdChanged_');
      spyOn(mockRouteService, 'on').and.callThrough();

      view.onCreated(Mocks.object('element'));

      assert(view['onProjectIdChanged_']).to.haveBeenCalledWith();
      assert(mockRouteService.on).to.haveBeenCalledWith(
          RouteServiceEvents.CHANGED,
          view['onProjectIdChanged_'],
          view);
    });
  });
});
