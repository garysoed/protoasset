import {assert, TestBase} from '../test-base';
TestBase.setup();

import {Mocks} from 'external/gs_tools/src/mock';
import {TestDispose} from 'external/gs_tools/src/testing';

import {ProjectView} from './project-view';
import {RouteServiceEvents} from '../routing/route-service-events';
import {Routes} from '../routing/routes';


describe('project.ProjectView', () => {
  let mockProjectCollection;
  let mockRouteService;
  let view: ProjectView;

  beforeEach(() => {
    mockProjectCollection = jasmine.createSpyObj('ProjectCollection', ['get']);
    mockRouteService = Mocks.listenable('RouteService');
    mockRouteService.getMatches = jasmine.createSpy('RouteService.getMatches');
    TestDispose.add(mockRouteService);

    view = new ProjectView(
        mockProjectCollection,
        mockRouteService,
        jasmine.createSpyObj('ThemeService', ['applyTheme']));
    TestDispose.add(view);
  });

  describe('updateProjectName_', () => {
    it('should update the project name corretly if there are matches', (done: any) => {
      let projectId = 'projectId';
      let projectName = 'projectName';

      let mockProject = jasmine.createSpyObj('Project', ['getName']);
      mockProject.getName.and.returnValue(projectName);

      mockProjectCollection.get.and.returnValue(Promise.resolve(mockProject));

      mockRouteService.getMatches.and.returnValue({projectId: projectId});

      spyOn(view['projectNameTextBridge_'], 'set');

      view['updateProjectName_']()
          .then(() => {
            assert(view['projectNameTextBridge_'].set).to.haveBeenCalledWith(projectName);
            assert(mockProjectCollection.get).to.haveBeenCalledWith(projectId);
            assert(mockRouteService.getMatches).to.haveBeenCalledWith(Routes.PROJECT);
            done();
          }, done.fail);
    });

    it('should not throw error if there are no projects corresponding to the project ID',
        (done: any) => {
          let projectId = 'projectId';

          mockProjectCollection.get.and.returnValue(Promise.resolve(null));

          mockRouteService.getMatches.and.returnValue({projectId: projectId});

          spyOn(view['projectNameTextBridge_'], 'set');

          view['updateProjectName_']()
              .then(() => {
                assert(view['projectNameTextBridge_'].set).toNot.haveBeenCalled();
                done();
              }, done.fail);
        });

    it('should not throw error if there are no matches', (done: any) => {
      mockRouteService.getMatches.and.returnValue(null);

      spyOn(view['projectNameTextBridge_'], 'set');

      view['updateProjectName_']()
          .then(() => {
            assert(view['projectNameTextBridge_'].set).toNot.haveBeenCalled();
            done();
          }, done.fail);
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
