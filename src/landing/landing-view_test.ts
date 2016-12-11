import {assert, Matchers, TestBase} from '../test-base';
TestBase.setup();

import {DisposableFunction} from 'external/gs_tools/src/dispose';
import {LocationServiceEvents} from 'external/gs_tools/src/ui';
import {Mocks} from 'external/gs_tools/src/mock';
import {TestDispose} from 'external/gs_tools/src/testing';

import {LandingView, projectItemElGenerator, projectItemElDataSetter} from './landing-view';
import {Project} from '../data/project';
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
    mockProjectCollection = jasmine.createSpyObj('ProjectCollection', ['list']);
    view = new LandingView(
        jasmine.createSpyObj('ThemeService', ['applyTheme']),
        mockProjectCollection,
        mockRouteService);
    TestDispose.add(view);
  });

  describe('onCreateAction_', () => {
  it('should go to create project view', () => {
      let route = Mocks.object('route');
      spyOn(Routes.CREATE_PROJECT, 'create').and.returnValue(route);

      view['onCreateAction_']();

      assert(mockRouteService.goTo).to.haveBeenCalledWith(route);
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

      view.onCreated(Mocks.object('element'));
      assert(view['onRouteChanged_']).to.haveBeenCalledWith();

      assert(mockRouteService.on).to.haveBeenCalledWith(
          LocationServiceEvents.CHANGED,
          view['onRouteChanged_'],
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
      let bridgeSetSpy = spyOn(view['projectCollectionBridge_'], 'set');

      let element = Mocks.object('element');
      view.onInserted(element)
          .then(() => {
            assert(view['projectCollectionBridge_'].set).to.haveBeenCalledWith(Matchers.any(Map));
            let projectsMap: Map<string, Project> = bridgeSetSpy.calls.argsFor(0)[0];
            assert(projectsMap).to.haveEntries([
              [projectName1, mockProject1],
              [projectName2, mockProject2],
            ]);
            done();
          }, done.fail);
    });
  });
});
