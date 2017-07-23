import { assert, TestBase } from '../test-base';
TestBase.setup();

import { ImmutableList, ImmutableSet } from 'external/gs_tools/src/immutable';
import { Mocks } from 'external/gs_tools/src/mock';
import { TestDispose } from 'external/gs_tools/src/testing';

import { LandingView, PROJECT_COLLECTION_CHILDREN } from '../landing/landing-view';
import { Views } from '../routing/views';


describe('PROJECT_COLLECTION_CHILDREN', () => {
  describe('create', () => {
    it('should create the correct element', () => {
      const element = Mocks.object('element');
      const mockDocument = jasmine.createSpyObj('Document', ['createElement']);
      mockDocument.createElement.and.returnValue(element);

      assert(PROJECT_COLLECTION_CHILDREN.bridge.create(mockDocument))
          .to.equal(element);
      assert(mockDocument.createElement).to.haveBeenCalledWith('pa-project-item');
    });
  });

  describe('get', () => {
    it('should return the correct project ID', () => {
      const projectId = 'projectId';
      const mockElement = jasmine.createSpyObj('Element', ['getAttribute']);
      mockElement.getAttribute.and.returnValue(projectId);
      assert(PROJECT_COLLECTION_CHILDREN.bridge.get(mockElement)).to.equal(projectId);
      assert(mockElement.getAttribute).to.haveBeenCalledWith('project-id');
    });
  });

  describe('set', () => {
    it('should set the attribute value correctly', () => {
      const projectId = 'projectId';
      const mockElement = jasmine.createSpyObj('Element', ['setAttribute']);

      PROJECT_COLLECTION_CHILDREN.bridge.set(projectId, mockElement);

      assert(mockElement.setAttribute).to.haveBeenCalledWith('project-id', projectId);
    });
  });
});

describe('landing.LandingView', () => {
  let view: LandingView;
  let mockRouteFactoryService: any;
  let mockRouteService: any;
  let mockProjectCollection: any;

  beforeEach(() => {
    mockRouteFactoryService =
        jasmine.createSpyObj('RouteFactoryService', ['createProject', 'landing']);
    mockRouteService = jasmine.createSpyObj('RouteService', ['getRoute', 'goTo', 'on']);
    mockProjectCollection = Mocks.listenable('ProjectCollection');
    mockProjectCollection.list = jasmine.createSpy('ProjectCollection.list');
    mockProjectCollection.search = jasmine.createSpy('ProjectCollection.search');
    view = new LandingView(
        jasmine.createSpyObj('ThemeService', ['applyTheme']),
        mockRouteFactoryService,
        mockRouteService);
    TestDispose.add(view, mockProjectCollection);
  });

  describe('onCreateAction_', () => {
    it('should go to create project view', () => {
      const routeFactory = Mocks.object('routeFactory');
      mockRouteFactoryService.createProject.and.returnValue(routeFactory);

      view.onCreateAction_();

      assert(mockRouteService.goTo).to.haveBeenCalledWith(routeFactory, {});
    });
  });

  describe('onCreated', () => {
    it('should initialize correctly', () => {
      const projectAccess = Mocks.object('projectAccess');
      spyOn(view, 'onRouteChanged_');

      view.onCreated(projectAccess);
      assert(view.onRouteChanged_).to.haveBeenCalledWith(projectAccess);
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

      const projectCollectionId = 'projectCollectionId';
      const mockProjectAccess = jasmine.createSpyObj('ProjectAccess', ['search']);
      mockProjectAccess.search.and.returnValue(Promise.resolve([mockProject1, mockProject2]));

      const rv = await view.onFilterButtonTextAttrChange_(
          newValue,
          {id: projectCollectionId} as any,
          mockProjectAccess);
      assert(rv.getAt(0)!.value as ImmutableList<any>)
          .to.haveElements([projectId1, projectId2]);
      assert(mockProjectAccess.search).to.haveBeenCalledWith(newValue);
    });

    it('should set the project collection to all projects if the filter text is null',
        async () => {
      const projectId1 = 'projectId1';
      const mockProject1 = jasmine.createSpyObj('Project1', ['getId']);
      mockProject1.getId.and.returnValue(projectId1);
      const projectId2 = 'projectId2';
      const mockProject2 = jasmine.createSpyObj('Project2', ['getId']);
      mockProject2.getId.and.returnValue(projectId2);

      const projectCollectionId = 'projectCollectionId';
      const mockProjectAccess = jasmine.createSpyObj('ProjectAccess', ['list']);
      mockProjectAccess.list.and.returnValue(Promise.resolve([mockProject1, mockProject2]));

      const rv = await view.onFilterButtonTextAttrChange_(
          null,
          {id: projectCollectionId} as any,
          mockProjectAccess);
      assert(rv.getAt(0)!.value as ImmutableList<any>)
          .to.haveElements([projectId1, projectId2]);
    });

    it('should set the project collection to all projects if the filter text is empty string',
        async () => {
      const projectId1 = 'projectId1';
      const mockProject1 = jasmine.createSpyObj('Project1', ['getId']);
      mockProject1.getId.and.returnValue(projectId1);
      const projectId2 = 'projectId2';
      const mockProject2 = jasmine.createSpyObj('Project2', ['getId']);
      mockProject2.getId.and.returnValue(projectId2);

      const projectCollectionId = 'projectCollectionId';
      const mockProjectAccess = jasmine.createSpyObj('ProjectAccess', ['list']);
      mockProjectAccess.list.and.returnValue(Promise.resolve([mockProject1, mockProject2]));

      const rv = await view.onFilterButtonTextAttrChange_(
          '',
          {id: projectCollectionId} as any,
          mockProjectAccess);
      assert(rv.getAt(0)!.value as ImmutableList<any>)
          .to.haveElements([projectId1, projectId2]);
    });
  });

  describe('onInserted', () => {
    it('should populate the project collection bridge correctly', async () => {
      const projectId1 = 'projectId1';
      const mockProject1 = jasmine.createSpyObj('Project1', ['getId', 'getName']);
      mockProject1.getId.and.returnValue(projectId1);

      const projectId2 = 'projectId2';
      const mockProject2 = jasmine.createSpyObj('Project2', ['getId', 'getName']);
      mockProject2.getId.and.returnValue(projectId2);

      const projectCollectionId = 'projectCollectionId';
      const mockProjectAccess = jasmine.createSpyObj('ProjectAccess', ['list']);
      mockProjectAccess.list.and
          .returnValue(Promise.resolve(ImmutableSet.of([mockProject1, mockProject2])));

      const list = await view.onInserted({id: projectCollectionId} as any, mockProjectAccess);
      assert(list.getAt(0)!.value as ImmutableList<any>)
          .to.haveElements([projectId1, projectId2]);
    });
  });

  describe('onProjectAdded_', () => {
    it('should add the project to the bridge', () => {
      const projectId = 'projectId';
      const mockProject = jasmine.createSpyObj('Project', ['getId']);
      mockProject.getId.and.returnValue(projectId);

      const projectCollectionId = 'projectCollectionId';
      const oldProjectId = 'oldProjectId';
      const projects = ImmutableList.of([oldProjectId]);

      const list = view.onProjectAdded_(
          {id: projectCollectionId, value: projects},
          {data: mockProject} as any);

      assert(list.getAt(0)!.value as ImmutableList<any>)
          .to.haveElements([oldProjectId, projectId]);
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

          const mockProjectAccess = jasmine.createSpyObj('ProjectAccess', ['list']);
          mockProjectAccess.list.and.returnValue(Promise.resolve(ImmutableSet.of([])));

          await view.onRouteChanged_(mockProjectAccess);
          assert(mockRouteService.goTo).to.haveBeenCalledWith(routeFactory, {});
        });

    it('should not redirect if the new location is landing but there are projects',
        async () => {
          const mockRoute = jasmine.createSpyObj('Route', ['getType']);
          mockRoute.getType.and.returnValue(Views.LANDING);
          mockRouteService.getRoute.and.returnValue(mockRoute);

          const mockProjectAccess = jasmine.createSpyObj('ProjectAccess', ['list']);
          mockProjectAccess.list.and.returnValue(
              Promise.resolve(ImmutableSet.of([Mocks.object('project')])));

          await view.onRouteChanged_(mockProjectAccess);
          assert(mockRouteService.goTo).toNot.haveBeenCalled();
        });

    it('should redirect to landing page if there are no valid routes', async () => {
      mockRouteService.getRoute.and.returnValue(null);

      const routeFactory = Mocks.object('routeFactory');
      mockRouteFactoryService.landing.and.returnValue(routeFactory);

      const mockProjectAccess = jasmine.createSpyObj('ProjectAccess', ['list']);

      await view.onRouteChanged_(mockProjectAccess);
      assert(mockRouteService.goTo).to.haveBeenCalledWith(routeFactory, {});
    });

    it('should not redirect if the new location is not landing', async () => {
      const mockRoute = jasmine.createSpyObj('Route', ['getType']);
      mockRoute.getType.and.returnValue(Views.CREATE_ASSET);
      mockRouteService.getRoute.and.returnValue(mockRoute);

      const mockProjectAccess = jasmine.createSpyObj('ProjectAccess', ['list']);
      mockProjectAccess.list.and.returnValue(Promise.resolve([]));

      await view.onRouteChanged_(mockProjectAccess);
      assert(mockRouteService.goTo).toNot.haveBeenCalled();
    });
  });
});
