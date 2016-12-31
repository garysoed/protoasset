import {assert, TestBase} from '../test-base';
TestBase.setup();

import {DisposableFunction} from 'external/gs_tools/src/dispose';
import {Mocks} from 'external/gs_tools/src/mock';
import {TestDispose} from 'external/gs_tools/src/testing';
import {LocationServiceEvents} from 'external/gs_tools/src/ui';

import {CollectionEvents} from '../data/collection-events';
import {Views} from '../routing/views';

import {LandingView, projectItemElDataSetter, projectItemElGenerator} from './landing-view';


describe('landing.projectItemElGenerator', () => {
  it('should create the correct element', () => {
    let element = Mocks.object('element');
    let mockDocument = jasmine.createSpyObj('Document', ['createElement']);
    mockDocument.createElement.and.returnValue(element);

    assert(projectItemElGenerator(mockDocument)).to.equal(element);
    assert(mockDocument.createElement).to.haveBeenCalledWith('pa-project-item');
  });
});

describe('landing.projectItemElDataSetter', () => {
  it('should set the attribute value correctly', () => {
    let projectId = 'projectId';
    let mockProject = jasmine.createSpyObj('Project', ['getId']);
    mockProject.getId.and.returnValue(projectId);

    let mockElement = jasmine.createSpyObj('Element', ['setAttribute']);

    projectItemElDataSetter(mockProject, mockElement);

    assert(mockElement.setAttribute).to.haveBeenCalledWith('project-id', projectId);
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
      let routeFactory = Mocks.object('routeFactory');
      mockRouteFactoryService.createProject.and.returnValue(routeFactory);

      view['onCreateAction_']();

      assert(mockRouteService.goTo).to.haveBeenCalledWith(routeFactory, {});
    });
  });

  describe('onFilterButtonTextAttrChange_', () => {
    it('should set the project collection to the search results if there is filter text',
        (done: any) => {
          let newValue = 'newValue';
          let projects = Mocks.object('projects');
          mockProjectCollection.search.and.returnValue(Promise.resolve(projects));
          spyOn(view['projectCollectionBridge_'], 'set');
          view['onFilterButtonTextAttrChange_'](newValue)
              .then(() => {
                assert(view['projectCollectionBridge_'].set).to.haveBeenCalledWith(projects);
                assert(mockProjectCollection.search).to.haveBeenCalledWith(newValue);
                done();
              }, done.fail);
        });

    it('should set the project collection to all projects if the filter text is null',
        (done: any) => {
          let newValue = null;
          let projects = Mocks.object('projects');
          mockProjectCollection.list.and.returnValue(Promise.resolve(projects));
          spyOn(view['projectCollectionBridge_'], 'set');
          view['onFilterButtonTextAttrChange_'](newValue)
              .then(() => {
                assert(view['projectCollectionBridge_'].set).to.haveBeenCalledWith(projects);
                done();
              }, done.fail);
        });

    it('should set the project collection to all projects if the filter text is empty string',
        (done: any) => {
          let newValue = '';
          let projects = Mocks.object('projects');
          mockProjectCollection.list.and.returnValue(Promise.resolve(projects));
          spyOn(view['projectCollectionBridge_'], 'set');
          view['onFilterButtonTextAttrChange_'](newValue)
              .then(() => {
                assert(view['projectCollectionBridge_'].set).to.haveBeenCalledWith(projects);
                done();
              }, done.fail);
        });
  });

  describe('onProjectAdded_', () => {
    it('should add the project to the bridge', () => {
      let project = Mocks.object('project');
      spyOn(view['projectCollectionBridge_'], 'get').and.returnValue([]);

      spyOn(view['projectCollectionBridge_'], 'set');

      view['onProjectAdded_'](project);

      assert(view['projectCollectionBridge_'].set).to.haveBeenCalledWith([project]);
    });

    it('should handle the case when project collection bridge has null value', () => {
      let project = Mocks.object('project');
      spyOn(view['projectCollectionBridge_'], 'get').and.returnValue(null);

      spyOn(view['projectCollectionBridge_'], 'set');

      view['onProjectAdded_'](project);

      assert(view['projectCollectionBridge_'].set).to.haveBeenCalledWith([project]);
    });
  });

  describe('onRouteChanged_', () => {
    it('should redirect to create page if the new location is landing but there are no projects',
        (done: any) => {
          let mockRoute = jasmine.createSpyObj('Route', ['getType']);
          mockRoute.getType.and.returnValue(Views.LANDING);
          mockRouteService.getRoute.and.returnValue(mockRoute);

          let routeFactory = Mocks.object('routeFactory');
          mockRouteFactoryService.createProject.and.returnValue(routeFactory);

          mockProjectCollection.list.and.returnValue(Promise.resolve([]));

          view['onRouteChanged_']()
              .then(() => {
                assert(mockRouteService.goTo).to.haveBeenCalledWith(routeFactory, {});
                done();
              }, done.fail);
        });

    it('should not redirect if the new location is landing but there are projects',
        (done: any) => {
          let mockRoute = jasmine.createSpyObj('Route', ['getType']);
          mockRoute.getType.and.returnValue(Views.LANDING);
          mockRouteService.getRoute.and.returnValue(mockRoute);

          mockProjectCollection.list.and.returnValue(Promise.resolve([Mocks.object('project')]));

          view['onRouteChanged_']()
              .then(() => {
                assert(mockRouteService.goTo).toNot.haveBeenCalled();
                done();
              }, done.fail);
        });

    it('should redirect to landing page if there are no valid routes', (done: any) => {
      mockRouteService.getRoute.and.returnValue(null);

      let routeFactory = Mocks.object('routeFactory');
      mockRouteFactoryService.landing.and.returnValue(routeFactory);

      view['onRouteChanged_']()
          .then(() => {
            assert(mockRouteService.goTo).to.haveBeenCalledWith(routeFactory, {});
            done();
          }, done.fail);
    });

    it('should not redirect if the new location is not landing', (done: any) => {
      let mockRoute = jasmine.createSpyObj('Route', ['getType']);
      mockRoute.getType.and.returnValue(Views.CREATE_ASSET);
      mockRouteService.getRoute.and.returnValue(mockRoute);

      mockProjectCollection.list.and.returnValue(Promise.resolve([]));

      view['onRouteChanged_']()
          .then(() => {
            assert(mockRouteService.goTo).toNot.haveBeenCalled();
            done();
          }, done.fail);
    });
  });

  describe('onCreated', () => {
    it('should initialize correctly', () => {
      spyOn(view, 'onRouteChanged_');
      mockRouteService.on.and.returnValue(DisposableFunction.of(() => {}));

      spyOn(mockProjectCollection, 'on').and.callThrough();

      view.onCreated(Mocks.object('element'));
      assert(view['onRouteChanged_']).to.haveBeenCalledWith();

      assert(mockRouteService.on).to.haveBeenCalledWith(
          LocationServiceEvents.CHANGED,
          view['onRouteChanged_'],
          view);
      assert(mockProjectCollection.on).to.haveBeenCalledWith(
          CollectionEvents.ADDED,
          view['onProjectAdded_'],
          view);
    });
  });

  describe('onInserted', () => {
    it('should populate the project collection bridge correctly', (done: any) => {
      let projectName1 = 'projectName1';
      let mockProject1 = jasmine.createSpyObj('Project1', ['getName']);
      mockProject1.getName.and.returnValue(projectName1);

      let projectName2 = 'projectName2';
      let mockProject2 = jasmine.createSpyObj('Project2', ['getName']);
      mockProject2.getName.and.returnValue(projectName2);

      mockProjectCollection.list.and.returnValue(Promise.resolve([mockProject1, mockProject2]));

      spyOn(view['projectCollectionBridge_'], 'set');

      let element = Mocks.object('element');
      view.onInserted(element)
          .then(() => {
            assert(view['projectCollectionBridge_'].set).to
                .haveBeenCalledWith([mockProject1, mockProject2]);
            done();
          }, done.fail);
    });
  });
});
