import { assert, TestBase } from '../test-base';
TestBase.setup();

import { FakeDataAccess } from 'external/gs_tools/src/datamodel';
import { FakeMonadSetter } from 'external/gs_tools/src/event';
import { ImmutableList, ImmutableMap, ImmutableSet } from 'external/gs_tools/src/immutable';
import { Mocks } from 'external/gs_tools/src/mock';
import { TestDispose } from 'external/gs_tools/src/testing';

import { FakeRouteNavigator, RouteNavigator } from 'external/gs_ui/src/routing';

import { Project } from '../data/project';
import { ASSET_ITEM_CHILDREN, AssetItemData, AssetListView } from '../project/asset-list-view';
import { TestRouteFactoryService } from '../routing/test-route-factory-service';
import { Views } from '../routing/views';


describe('ASSET_ITEM_CHILDREN', () => {
  describe('create', () => {
    it('should create the correct element', () => {
      const element = Mocks.object('element');
      const mockDocument = jasmine.createSpyObj('Document', ['createElement']);
      mockDocument.createElement.and.returnValue(element);

      assert(ASSET_ITEM_CHILDREN.bridge.create(mockDocument, Mocks.object('instance')))
          .to.equal(element);
      assert(mockDocument.createElement).to.haveBeenCalledWith('pa-asset-item');
    });
  });

  describe('get', () => {
    it('should return the correct data', () => {
      const assetId = 'assetId';
      const projectId = 'projectId';
      const element = document.createElement('div');
      element.setAttribute('asset-id', assetId);
      element.setAttribute('project-id', projectId);

      assert(ASSET_ITEM_CHILDREN.bridge.get(element)).to.equal({assetId, projectId});
    });

    it('should return null if assetId is null', () => {
      const element = document.createElement('div');
      element.setAttribute('asset-id', '');
      element.setAttribute('project-id', 'projectId');

      assert(ASSET_ITEM_CHILDREN.bridge.get(element)).to.beNull();
    });

    it('should return null if projectId is null', () => {
      const element = document.createElement('div');
      element.setAttribute('asset-id', 'assetId');
      element.setAttribute('project-id', '');

      assert(ASSET_ITEM_CHILDREN.bridge.get(element)).to.beNull();
    });
  });

  describe('set', () => {
    it('should set the attributes correctly', () => {
      const assetId = 'assetId';
      const projectId = 'projectId';
      const element = document.createElement('div');

      ASSET_ITEM_CHILDREN.bridge.set({assetId, projectId}, element, Mocks.object('instance'));
      assert(element.getAttribute('asset-id')).to.equal(assetId);
      assert(element.getAttribute('project-id')).to.equal(projectId);
    });
  });
});


describe('project.AssetListView', () => {
  let mockRouteService: any;
  let view: AssetListView;

  beforeEach(() => {
    mockRouteService = Mocks.listenable('RouteService');
    mockRouteService.getParams = jasmine.createSpy('RouteService.getParams');
    mockRouteService.goTo = jasmine.createSpy('RouteService.goTo');
    TestDispose.add(mockRouteService);

    view = new AssetListView(
        TestRouteFactoryService,
        mockRouteService,
        jasmine.createSpyObj('ThemeService', ['applyTheme']));
    TestDispose.add(view);
  });

  describe('getProjectId_', () => {
    it('should return the correct project ID if there is a match', () => {
      const projectId = 'projectId';
      const fakeRouteNavigator = new FakeRouteNavigator<Views>();
      spyOn(fakeRouteNavigator, 'getRoute').and.returnValue({params: {projectId}});

      assert(view['getProjectId_'](fakeRouteNavigator)).to.equal(projectId);
      assert(fakeRouteNavigator.getRoute).to
          .haveBeenCalledWith(TestRouteFactoryService.assetList());
    });

    it('should return null if there are no routes', () => {
      const fakeRouteNavigator = new FakeRouteNavigator<Views>();
      spyOn(fakeRouteNavigator, 'getRoute').and.returnValue(null);

      assert(view['getProjectId_'](fakeRouteNavigator)).to.beNull();
      assert(fakeRouteNavigator.getRoute).to
          .haveBeenCalledWith(TestRouteFactoryService.assetList());
    });
  });

  describe('onCreateButtonClicked_', () => {
    it('should navigate to create asset view', () => {
      const projectId = 'projectId';
      spyOn(view, 'getProjectId_').and.returnValue(projectId);

      const fakeRouteNavigator = new FakeRouteNavigator<Views>();
      const fakeRouteSetter = new FakeMonadSetter<RouteNavigator<Views>>(fakeRouteNavigator);

      const updates = view.onCreateButtonClicked_(fakeRouteSetter);
      assert(fakeRouteSetter.findValue(updates)!.value.getDestination()).to.matchObject({
        params: {projectId},
        type: Views.CREATE_ASSET,
      });
      assert(view['getProjectId_']).to.haveBeenCalledWith(fakeRouteNavigator);
    });

    it('should do nothing if there are no project IDs', () => {
      spyOn(view, 'getProjectId_').and.returnValue(null);

      const fakeRouteNavigator = new FakeRouteNavigator<Views>();
      const fakeRouteSetter = new FakeMonadSetter<RouteNavigator<Views>>(fakeRouteNavigator);

      assert(view.onCreateButtonClicked_(fakeRouteSetter)).to.equal([]);
      assert(view['getProjectId_']).to.haveBeenCalledWith(fakeRouteNavigator);
    });
  });

  describe('onProjectIdChanged_', () => {
    it('should update the project name corretly if there are matches', async () => {
      const projectId = 'projectId';
      spyOn(view, 'getProjectId_').and.returnValue(projectId);

      const projectName = 'projectName';
      const assetId1 = 'assetId1';
      const assetId2 = 'assetId2';
      const project = Project.withId(projectId)
          .setName(projectName)
          .setAssets(ImmutableSet.of([assetId1, assetId2]));

      const fakeAssetItemListSetter =
          new FakeMonadSetter<ImmutableList<AssetItemData>>(ImmutableList.of([]));
      const fakeProjectNameSetter = new FakeMonadSetter<string | null>(null);
      const fakeProjectAccess = new FakeDataAccess<Project>(ImmutableMap.of([
        [projectId, project],
      ]));
      const fakeRouteNavigator = new FakeRouteNavigator<Views>();

      const updates = await view.onProjectIdChanged_(
          fakeAssetItemListSetter,
          fakeProjectNameSetter,
          fakeProjectAccess,
          fakeRouteNavigator);
      assert(fakeProjectNameSetter.findValue(updates)!.value).to.equal(projectName);
      assert(fakeAssetItemListSetter.findValue(updates)!.value).to.haveElements([
        {assetId: assetId1, projectId},
        {assetId: assetId2, projectId},
      ]);
      assert(view['getProjectId_']).to.haveBeenCalledWith(fakeRouteNavigator);
    });

    it('should do nothing if project cannot be found', async () => {
      const projectId = 'projectId';
      spyOn(view, 'getProjectId_').and.returnValue(projectId);

      const fakeAssetItemListSetter =
          new FakeMonadSetter<ImmutableList<AssetItemData>>(ImmutableList.of([]));
      const fakeProjectNameSetter = new FakeMonadSetter<string | null>(null);
      const fakeProjectAccess = new FakeDataAccess<Project>();
      const fakeRouteNavigator = new FakeRouteNavigator<Views>();

      const updates = await view.onProjectIdChanged_(
          fakeAssetItemListSetter,
          fakeProjectNameSetter,
          fakeProjectAccess,
          fakeRouteNavigator);
      assert([...updates]).to.equal([]);
    });

    it('should do nothing if there are no project IDs',
        async () => {
      spyOn(view, 'getProjectId_').and.returnValue(null);

      const fakeAssetItemListSetter =
          new FakeMonadSetter<ImmutableList<AssetItemData>>(ImmutableList.of([]));
      const fakeProjectNameSetter = new FakeMonadSetter<string | null>(null);
      const fakeProjectAccess = new FakeDataAccess<Project>();
      const fakeRouteNavigator = new FakeRouteNavigator<Views>();

      const updates = await view.onProjectIdChanged_(
          fakeAssetItemListSetter,
          fakeProjectNameSetter,
          fakeProjectAccess,
          fakeRouteNavigator);
      assert([...updates]).to.equal([]);
    });
  });

  describe('onSettingsButtonClicked_', () => {
    it('should navigate to project settings view', () => {
      const projectId = 'projectId';
      spyOn(view, 'getProjectId_').and.returnValue(projectId);

      const fakeRouteNavigator = new FakeRouteNavigator<Views>();
      const fakeRouteSetter = new FakeMonadSetter<RouteNavigator<Views>>(fakeRouteNavigator);

      const updates = view.onSettingsButtonClicked_(fakeRouteSetter);
      assert(fakeRouteSetter.findValue(updates)!.value.getDestination()).to.matchObject({
        params: {projectId},
        type: Views.PROJECT_SETTINGS,
      });
    });

    it('should do nothing if there are no project IDs', () => {
      spyOn(view, 'getProjectId_').and.returnValue(null);

      const fakeRouteNavigator = new FakeRouteNavigator<Views>();
      const fakeRouteSetter = new FakeMonadSetter<RouteNavigator<Views>>(fakeRouteNavigator);

      assert(view.onSettingsButtonClicked_(fakeRouteSetter)).to.equal([]);
    });
  });
});
