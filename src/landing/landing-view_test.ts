import {assert, TestBase} from '../test-base';
TestBase.setup();

import {DisposableFunction} from 'external/gs_tools/src/dispose';
import {LocationServiceEvents} from 'external/gs_tools/src/ui';
import {Mocks} from 'external/gs_tools/src/mock';
import {TestDispose} from 'external/gs_tools/src/testing';

import {CollectionEvents} from '../data/collection-events';
import {LandingView, projectItemElGenerator, projectItemElDataSetter} from './landing-view';
import {Routes} from '../routing/routes';


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
  let mockRouteService;
  let mockProjectCollection;

  beforeEach(() => {
    mockRouteService = jasmine.createSpyObj('RouteService', ['goTo', 'isDisplayed', 'on']);
    mockProjectCollection = Mocks.listenable('ProjectCollection');
    mockProjectCollection.list = jasmine.createSpy('ProjectCollection.list');
    mockProjectCollection.search = jasmine.createSpy('ProjectCollection.search');
    view = new LandingView(
        jasmine.createSpyObj('ThemeService', ['applyTheme']),
        mockProjectCollection,
        mockRouteService);
    TestDispose.add(view, mockProjectCollection);
  });

  describe('onCreateAction_', () => {
    it('should go to create project view', () => {
      let route = Mocks.object('route');
      spyOn(Routes.CREATE_PROJECT, 'create').and.returnValue(route);

      view['onCreateAction_']();

      assert(mockRouteService.goTo).to.haveBeenCalledWith(route);
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
          let createProjectRoute = Mocks.object('createProjectRoute');
          spyOn(Routes.CREATE_PROJECT, 'create').and.returnValue(createProjectRoute);
          mockRouteService.isDisplayed.and.returnValue(true);
          mockProjectCollection.list.and.returnValue(Promise.resolve([]));

          view['onRouteChanged_']()
              .then(() => {
                assert(mockRouteService.goTo).to.haveBeenCalledWith(createProjectRoute);
                assert(mockRouteService.isDisplayed).to.haveBeenCalledWith(Routes.LANDING);
                done();
              }, done.fail);
        });

    it('should not redirect if the new location is landing but there are projects',
        (done: any) => {
          mockRouteService.isDisplayed.and.returnValue(true);
          mockProjectCollection.list.and.returnValue(Promise.resolve([Mocks.object('project')]));

          view['onRouteChanged_']()
              .then(() => {
                assert(mockRouteService.goTo).toNot.haveBeenCalled();
                done();
              }, done.fail);
        });

    it('should not redirect if the new location is not landing', (done: any) => {
      mockRouteService.isDisplayed.and.returnValue(false);
      mockProjectCollection.list.and.returnValue(Promise.resolve([]));

      view['onRouteChanged_']()
          .then(() => {
            assert(mockRouteService.goTo).toNot.haveBeenCalled();
            assert(mockRouteService.isDisplayed).to.haveBeenCalledWith(Routes.LANDING);
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
