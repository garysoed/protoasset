import { assert, TestBase } from '../test-base';
TestBase.setup();

import { ImmutableSet } from 'external/gs_tools/src/immutable';
import { Mocks } from 'external/gs_tools/src/mock';
import { TestDispose } from 'external/gs_tools/src/testing';
import { LocationServiceEvents } from 'external/gs_tools/src/ui';

import { CollectionEvents } from '../data/collection-events';
import { LandingView, PROJECT_ITEM_DATA_HELPER } from '../landing/landing-view';
import { Views } from '../routing/views';


describe('PROJECT_ITEM_DATA_HELPER', () => {
  describe('create', () => {
    it('should create the correct element', () => {
      const element = Mocks.object('element');
      const mockDocument = jasmine.createSpyObj('Document', ['createElement']);
      mockDocument.createElement.and.returnValue(element);

      assert(PROJECT_ITEM_DATA_HELPER.create(mockDocument, Mocks.object('instance')))
          .to.equal(element);
      assert(mockDocument.createElement).to.haveBeenCalledWith('pa-project-item');
    });
  });

  describe('get', () => {
    it('should return the correct project ID', () => {
      const projectId = 'projectId';
      const mockElement = jasmine.createSpyObj('Element', ['getAttribute']);
      mockElement.getAttribute.and.returnValue(projectId);
      assert(PROJECT_ITEM_DATA_HELPER.get(mockElement)).to.equal(projectId);
      assert(mockElement.getAttribute).to.haveBeenCalledWith('project-id');
    });
  });

  describe('set', () => {
    it('should set the attribute value correctly', () => {
      const projectId = 'projectId';
      const mockElement = jasmine.createSpyObj('Element', ['setAttribute']);

      PROJECT_ITEM_DATA_HELPER.set(projectId, mockElement, Mocks.object('instance'));

      assert(mockElement.setAttribute).to.haveBeenCalledWith('project-id', projectId);
    });
  });
});


describe('landing.LandingView', () => {
  let view: LandingView;
  let mockRouteFactoryService;
  let mockRouteService;
  let mockProjectCollection;

  beforeEach(() => {
    mockRouteFactoryService =
        jasmine.createSpyObj('RouteFactoryService', ['createProject', 'landing']);
    mockRouteService = jasmine.createSpyObj('RouteService', ['getRoute', 'goTo', 'on']);
    mockProjectCollection = Mocks.listenable('ProjectCollection');
    mockProjectCollection.list = jasmine.createSpy('ProjectCollection.list');
    mockProjectCollection.search = jasmine.createSpy('ProjectCollection.search');
    view = new LandingView(
        jasmine.createSpyObj('ThemeService', ['applyTheme']),
        mockProjectCollection,
        mockRouteFactoryService,
        mockRouteService);
    TestDispose.add(view, mockProjectCollection);
  });

  describe('onCreateAction_', () => {
    it('should go to create project view', () => {
      const routeFactory = Mocks.object('routeFactory');
      mockRouteFactoryService.createProject.and.returnValue(routeFactory);

      view['onCreateAction_']();

      assert(mockRouteService.goTo).to.haveBeenCalledWith(routeFactory, {});
    });
  });

  describe('onFilterButtonTextAttrChange_', () => {
    it('should set the project collection to the search results if there is filter text',
        async () => {
          const newValue = 'newValue';
          const projectId1 = 'projectId1';
          const mockProject1 = jasmine.createSpyObj('Project1', ['getId']);
          mockProject1.getId.and.returnValue(projectId1);
          const projectId2 = 'projectId2';
          const mockProject2 = jasmine.createSpyObj('Project2', ['getId']);
          mockProject2.getId.and.returnValue(projectId2);
          mockProjectCollection.search.and
              .returnValue(Promise.resolve([mockProject1, mockProject2]));
          spyOn(view['projectCollectionHook_'], 'set');
          await view['onFilterButtonTextAttrChange_'](newValue);
          assert(view['projectCollectionHook_'].set).to
              .haveBeenCalledWith([projectId1, projectId2]);
          assert(mockProjectCollection.search).to.haveBeenCalledWith(newValue);
        });

    it('should set the project collection to all projects if the filter text is null',
        async () => {
          const newValue = null;
          const projectId1 = 'projectId1';
          const mockProject1 = jasmine.createSpyObj('Project1', ['getId']);
          mockProject1.getId.and.returnValue(projectId1);
          const projectId2 = 'projectId2';
          const mockProject2 = jasmine.createSpyObj('Project2', ['getId']);
          mockProject2.getId.and.returnValue(projectId2);
          mockProjectCollection.list.and.returnValue(Promise.resolve([mockProject1, mockProject2]));
          spyOn(view['projectCollectionHook_'], 'set');
          await view['onFilterButtonTextAttrChange_'](newValue);
          assert(view['projectCollectionHook_'].set).to
              .haveBeenCalledWith([projectId1, projectId2]);
        });

    it('should set the project collection to all projects if the filter text is empty string',
        async () => {
          const newValue = '';
          const projectId1 = 'projectId1';
          const mockProject1 = jasmine.createSpyObj('Project1', ['getId']);
          mockProject1.getId.and.returnValue(projectId1);
          const projectId2 = 'projectId2';
          const mockProject2 = jasmine.createSpyObj('Project2', ['getId']);
          mockProject2.getId.and.returnValue(projectId2);
          mockProjectCollection.list.and.returnValue(Promise.resolve([mockProject1, mockProject2]));
          spyOn(view['projectCollectionHook_'], 'set');
          await view['onFilterButtonTextAttrChange_'](newValue);
          assert(view['projectCollectionHook_'].set).to
              .haveBeenCalledWith([projectId1, projectId2]);
        });
  });

  describe('onProjectAdded_', () => {
    it('should add the project to the bridge', () => {
      const projectId = 'projectId';
      const mockProject = jasmine.createSpyObj('Project', ['getId']);
      mockProject.getId.and.returnValue(projectId);
      spyOn(view['projectCollectionHook_'], 'get').and.returnValue([]);

      spyOn(view['projectCollectionHook_'], 'set');

      view['onProjectAdded_'](mockProject);

      assert(view['projectCollectionHook_'].set).to.haveBeenCalledWith([projectId]);
    });

    it('should handle the case when project collection bridge has null value', () => {
      const projectId = 'projectId';
      const mockProject = jasmine.createSpyObj('Project', ['getId']);
      mockProject.getId.and.returnValue(projectId);
      spyOn(view['projectCollectionHook_'], 'get').and.returnValue(null);

      spyOn(view['projectCollectionHook_'], 'set');

      view['onProjectAdded_'](mockProject);

      assert(view['projectCollectionHook_'].set).to.haveBeenCalledWith([projectId]);
    });
  });

  describe('onRouteChanged_', () => {
    it('should redirect to create page if the new location is landing but there are no projects',
        async () => {
          const mockRoute = jasmine.createSpyObj('Route', ['getType']);
          mockRoute.getType.and.returnValue(Views.LANDING);
          mockRouteService.getRoute.and.returnValue(mockRoute);

          const routeFactory = Mocks.object('routeFactory');
          mockRouteFactoryService.createProject.and.returnValue(routeFactory);

          mockProjectCollection.list.and.returnValue(Promise.resolve(ImmutableSet.of([])));

          await view['onRouteChanged_']();
          assert(mockRouteService.goTo).to.haveBeenCalledWith(routeFactory, {});
        });

    it('should not redirect if the new location is landing but there are projects',
        async () => {
          const mockRoute = jasmine.createSpyObj('Route', ['getType']);
          mockRoute.getType.and.returnValue(Views.LANDING);
          mockRouteService.getRoute.and.returnValue(mockRoute);

          mockProjectCollection.list.and.returnValue(
              Promise.resolve(ImmutableSet.of([Mocks.object('project')])));

          await view['onRouteChanged_']();
          assert(mockRouteService.goTo).toNot.haveBeenCalled();
        });

    it('should redirect to landing page if there are no valid routes', async () => {
      mockRouteService.getRoute.and.returnValue(null);

      const routeFactory = Mocks.object('routeFactory');
      mockRouteFactoryService.landing.and.returnValue(routeFactory);

      await view['onRouteChanged_']();
      assert(mockRouteService.goTo).to.haveBeenCalledWith(routeFactory, {});
    });

    it('should not redirect if the new location is not landing', async () => {
      const mockRoute = jasmine.createSpyObj('Route', ['getType']);
      mockRoute.getType.and.returnValue(Views.CREATE_ASSET);
      mockRouteService.getRoute.and.returnValue(mockRoute);

      mockProjectCollection.list.and.returnValue(Promise.resolve([]));

      await view['onRouteChanged_']();
      assert(mockRouteService.goTo).toNot.haveBeenCalled();
    });
  });

  describe('onCreated', () => {
    it('should initialize correctly', () => {
      spyOn(view, 'onRouteChanged_');
      spyOn(view, 'listenTo');

      spyOn(mockProjectCollection, 'on').and.callThrough();

      view.onCreated(Mocks.object('element'));
      assert(view['onRouteChanged_']).to.haveBeenCalledWith();

      assert(view.listenTo).to.haveBeenCalledWith(
          mockRouteService,
          LocationServiceEvents.CHANGED,
          view['onRouteChanged_']);
      assert(view.listenTo).to.haveBeenCalledWith(
          mockProjectCollection,
          CollectionEvents.ADDED,
          view['onProjectAdded_']);
    });
  });

  describe('onInserted', () => {
    it('should populate the project collection bridge correctly', async () => {
      const projectId1 = 'projectId1';
      const projectName1 = 'projectName1';
      const mockProject1 = jasmine.createSpyObj('Project1', ['getId', 'getName']);
      mockProject1.getId.and.returnValue(projectId1);
      mockProject1.getName.and.returnValue(projectName1);

      const projectId2 = 'projectId2';
      const projectName2 = 'projectName2';
      const mockProject2 = jasmine.createSpyObj('Project2', ['getId', 'getName']);
      mockProject2.getId.and.returnValue(projectId2);
      mockProject2.getName.and.returnValue(projectName2);

      mockProjectCollection.list.and
          .returnValue(Promise.resolve(ImmutableSet.of([mockProject1, mockProject2])));

      spyOn(view['projectCollectionHook_'], 'set');

      const element = Mocks.object('element');
      await view.onInserted(element);
      assert(view['projectCollectionHook_'].set).to.haveBeenCalledWith([projectId1, projectId2]);
    });
  });
});
