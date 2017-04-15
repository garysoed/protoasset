import { assert, TestBase } from '../test-base';
TestBase.setup();

import { Mocks } from 'external/gs_tools/src/mock';
import { TestDispose } from 'external/gs_tools/src/testing';

import { RouteServiceEvents } from 'external/gs_ui/src/routing';

import { ASSET_DATA_HELPER, AssetListView } from '../project/asset-list-view';


describe('ASSET_DATA_HELPER', () => {
  describe('create', () => {
    it('should create the correct element', () => {
      const element = Mocks.object('element');
      const mockDocument = jasmine.createSpyObj('Document', ['createElement']);
      mockDocument.createElement.and.returnValue(element);
      assert(ASSET_DATA_HELPER.create(mockDocument, Mocks.object('instance'))).to.equal(element);
      assert(mockDocument.createElement).to.haveBeenCalledWith('pa-asset-item');
    });
  });

  describe('get', () => {
    it('should return the correct data', () => {
      const assetId = 'assetId';
      const projectId = 'projectId';
      const mockElement = jasmine.createSpyObj('Element', ['getAttribute']);
      mockElement.getAttribute.and.callFake((attrName: string) => {
        switch (attrName) {
          case 'gs-asset-id':
            return assetId;
          case 'gs-project-id':
            return projectId;
        }
      });
      assert(ASSET_DATA_HELPER.get(mockElement)).to.equal({assetId, projectId});
      assert(mockElement.getAttribute).to.haveBeenCalledWith('gs-asset-id');
      assert(mockElement.getAttribute).to.haveBeenCalledWith('gs-project-id');
    });

    it('should return null if assetId is null', () => {
      const mockElement = jasmine.createSpyObj('Element', ['getAttribute']);
      mockElement.getAttribute.and.callFake((attrName: string) => {
        switch (attrName) {
          case 'gs-asset-id':
            return null;
          case 'gs-project-id':
            return 'projectId';
        }
      });
      assert(ASSET_DATA_HELPER.get(mockElement)).to.beNull();
    });

    it('should return null if projectId is null', () => {
      const mockElement = jasmine.createSpyObj('Element', ['getAttribute']);
      mockElement.getAttribute.and.callFake((attrName: string) => {
        switch (attrName) {
          case 'gs-asset-id':
            return 'assetId';
          case 'gs-project-id':
            return null;
        }
      });
      assert(ASSET_DATA_HELPER.get(mockElement)).to.beNull();
    });
  });

  describe('set', () => {
    it('should set the attributes correctly', () => {
      const assetId = 'assetId';
      const projectId = 'projectId';
      const mockElement = jasmine.createSpyObj('Element', ['setAttribute']);
      ASSET_DATA_HELPER.set({assetId, projectId}, mockElement, Mocks.object('instance'));
      assert(mockElement.setAttribute).to.haveBeenCalledWith('gs-asset-id', assetId);
      assert(mockElement.setAttribute).to.haveBeenCalledWith('gs-project-id', projectId);
    });
  });
});


describe('project.AssetListView', () => {
  let mockAssetCollection;
  let mockProjectCollection;
  let mockRouteFactoryService;
  let mockRouteService;
  let view: AssetListView;

  beforeEach(() => {
    mockAssetCollection = jasmine.createSpyObj('AssetCollection', ['list']);
    mockProjectCollection = jasmine.createSpyObj('ProjectCollection', ['get']);
    mockRouteFactoryService = jasmine.createSpyObj(
        'RouteFactoryService',
        ['assetList', 'createAsset', 'projectSettings']);
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
      const projectId = 'projectId';

      const routeFactory = Mocks.object('routeFactory');
      mockRouteFactoryService.assetList.and.returnValue(routeFactory);

      mockRouteService.getParams.and.returnValue({projectId: projectId});

      assert(view['getProjectId_']()).to.equal(projectId);
      assert(mockRouteService.getParams).to.haveBeenCalledWith(routeFactory);
    });

    it('should return null if there are no project IDs', () => {
      const routeFactory = Mocks.object('routeFactory');
      mockRouteFactoryService.assetList.and.returnValue(routeFactory);

      mockRouteService.getParams.and.returnValue(null);

      assert(view['getProjectId_']()).to.beNull();
      assert(mockRouteService.getParams).to.haveBeenCalledWith(routeFactory);
    });
  });

  describe('onProjectIdChanged_', () => {
    it('should update the project name corretly if there are matches', async () => {
      const projectId = 'projectId';
      const projectName = 'projectName';

      const mockProject = jasmine.createSpyObj('Project', ['getName']);
      mockProject.getName.and.returnValue(projectName);

      mockAssetCollection.list.and.returnValue(Promise.resolve([]));
      mockProjectCollection.get.and.returnValue(Promise.resolve(mockProject));

      spyOn(view, 'getProjectId_').and.returnValue(projectId);
      spyOn(view['assetsHook_'], 'set');
      spyOn(view['projectNameTextHook_'], 'set');

      await view['onProjectIdChanged_']();
      assert(view['projectNameTextHook_'].set).to.haveBeenCalledWith(projectName);
      assert(mockProjectCollection.get).to.haveBeenCalledWith(projectId);
    });

    it('should set the assets', async () => {
      const projectId = 'projectId';

      const assetId1 = 'assetId1';
      const projectId1 = 'projectId1';
      const mockAsset1 = jasmine.createSpyObj('Asset1', ['getId', 'getProjectId']);
      mockAsset1.getId.and.returnValue(assetId1);
      mockAsset1.getProjectId.and.returnValue(projectId1);

      const assetId2 = 'assetId2';
      const projectId2 = 'projectId2';
      const mockAsset2 = jasmine.createSpyObj('Asset2', ['getId', 'getProjectId']);
      mockAsset2.getId.and.returnValue(assetId2);
      mockAsset2.getProjectId.and.returnValue(projectId2);

      mockAssetCollection.list.and.returnValue(Promise.resolve([mockAsset1, mockAsset2]));
      mockProjectCollection.get.and.returnValue(Promise.resolve(null));

      spyOn(view, 'getProjectId_').and.returnValue(projectId);
      spyOn(view['assetsHook_'], 'set');
      spyOn(view['projectNameTextHook_'], 'set');

      await view['onProjectIdChanged_']();
      assert(view['assetsHook_'].set).to.haveBeenCalledWith([
        {assetId: assetId1, projectId: projectId1},
        {assetId: assetId2, projectId: projectId2},
      ]);
      assert(mockAssetCollection.list).to.haveBeenCalledWith(projectId);
    });

    it('should not throw error if there are no projects corresponding to the project ID',
        async () => {
          const projectId = 'projectId';

          mockAssetCollection.list.and.returnValue(Promise.resolve([]));
          mockProjectCollection.get.and.returnValue(Promise.resolve(null));
          spyOn(view, 'getProjectId_').and.returnValue(projectId);
          spyOn(view['assetsHook_'], 'set');
          spyOn(view['projectNameTextHook_'], 'set');

          await view['onProjectIdChanged_']();
          assert(view['projectNameTextHook_'].set).toNot.haveBeenCalled();
        });

    it('should not throw error if there are no project IDs', async () => {
      spyOn(view, 'getProjectId_').and.returnValue(null);
      spyOn(view['projectNameTextHook_'], 'set');

      await view['onProjectIdChanged_']();
      assert(view['projectNameTextHook_'].set).toNot.haveBeenCalled();
    });
  });

  describe('onCreateButtonClicked_', () => {
    it('should navigate to create asset view', () => {
      const projectId = 'projectId';
      spyOn(view, 'getProjectId_').and.returnValue(projectId);

      const routeFactory = Mocks.object('routeFactory');
      mockRouteFactoryService.createAsset.and.returnValue(routeFactory);

      view.onCreateButtonClicked_();

      assert(mockRouteService.goTo).to.haveBeenCalledWith(routeFactory, {projectId: projectId});
    });

    it('should not throw error if there are no project IDs', () => {
      spyOn(view, 'getProjectId_').and.returnValue(null);
      assert(() => {
        view.onCreateButtonClicked_();
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

  describe('onSettingsButtonClicked_', () => {
    it('should navigate to project settings view', () => {
      const projectId = 'projectId';
      spyOn(view, 'getProjectId_').and.returnValue(projectId);

      const routeFactory = Mocks.object('routeFactory');
      mockRouteFactoryService.projectSettings.and.returnValue(routeFactory);

      view.onSettingsButtonClicked_();

      assert(mockRouteService.goTo).to.haveBeenCalledWith(routeFactory, {projectId: projectId});
    });

    it('should not throw error if there are no project IDs', () => {
      spyOn(view, 'getProjectId_').and.returnValue(null);
      assert(() => {
        view.onSettingsButtonClicked_();
      }).toNot.throw();
    });
  });
});
