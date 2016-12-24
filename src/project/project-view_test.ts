import {assert, TestBase} from '../test-base';
TestBase.setup();

import {Mocks} from 'external/gs_tools/src/mock';
import {TestDispose} from 'external/gs_tools/src/testing';

import {RouteServiceEvents} from 'external/gs_ui/src/routing';

import {ProjectView} from './project-view';


describe('project.ProjectView', () => {
  let mockProjectCollection;
  let mockRouteFactoryService;
  let mockRouteService;
  let view: ProjectView;

  beforeEach(() => {
    mockProjectCollection = jasmine.createSpyObj('ProjectCollection', ['get']);
    mockRouteFactoryService =
        jasmine.createSpyObj('RouteFactoryService', ['createAsset', 'project']);
    mockRouteService = Mocks.listenable('RouteService');
    mockRouteService.getParams = jasmine.createSpy('RouteService.getParams');
    mockRouteService.goTo = jasmine.createSpy('RouteService.goTo');
    TestDispose.add(mockRouteService);

    view = new ProjectView(
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
      mockRouteFactoryService.project.and.returnValue(routeFactory);

      mockRouteService.getParams.and.returnValue({projectId: projectId});

      assert(view['getProjectId_']()).to.equal(projectId);
      assert(mockRouteService.getParams).to.haveBeenCalledWith(routeFactory);
    });

    it('should return null if there are no project IDs', () => {
      let routeFactory = Mocks.object('routeFactory');
      mockRouteFactoryService.project.and.returnValue(routeFactory);

      mockRouteService.getParams.and.returnValue(null);

      assert(view['getProjectId_']()).to.beNull();
      assert(mockRouteService.getParams).to.haveBeenCalledWith(routeFactory);
    });
  });

  describe('updateProjectName_', () => {
    it('should update the project name corretly if there are matches', (done: any) => {
      let projectId = 'projectId';
      let projectName = 'projectName';

      let mockProject = jasmine.createSpyObj('Project', ['getName']);
      mockProject.getName.and.returnValue(projectName);

      mockProjectCollection.get.and.returnValue(Promise.resolve(mockProject));

      spyOn(view, 'getProjectId_').and.returnValue(projectId);
      spyOn(view['projectNameTextBridge_'], 'set');

      view['updateProjectName_']()
          .then(() => {
            assert(view['projectNameTextBridge_'].set).to.haveBeenCalledWith(projectName);
            assert(mockProjectCollection.get).to.haveBeenCalledWith(projectId);
            done();
          }, done.fail);
    });

    it('should not throw error if there are no projects corresponding to the project ID',
        (done: any) => {
          let projectId = 'projectId';

          mockProjectCollection.get.and.returnValue(Promise.resolve(null));
          spyOn(view, 'getProjectId_').and.returnValue(projectId);
          spyOn(view['projectNameTextBridge_'], 'set');

          view['updateProjectName_']()
              .then(() => {
                assert(view['projectNameTextBridge_'].set).toNot.haveBeenCalled();
                done();
              }, done.fail);
        });

    it('should not throw error if there are no project IDs', (done: any) => {
      spyOn(view, 'getProjectId_').and.returnValue(null);
      spyOn(view['projectNameTextBridge_'], 'set');

      view['updateProjectName_']()
          .then(() => {
            assert(view['projectNameTextBridge_'].set).toNot.haveBeenCalled();
            done();
          }, done.fail);
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
      spyOn(view, 'updateProjectName_');
      spyOn(mockRouteService, 'on').and.callThrough();

      view.onCreated(Mocks.object('element'));

      assert(view['updateProjectName_']).to.haveBeenCalledWith();
      assert(mockRouteService.on).to.haveBeenCalledWith(
          RouteServiceEvents.CHANGED,
          view['updateProjectName_'],
          view);
    });
  });
});
