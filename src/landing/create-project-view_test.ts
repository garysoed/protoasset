import {assert, Matchers, TestBase} from '../test-base';
TestBase.setup();

import {Mocks} from 'external/gs_tools/src/mock';
import {TestDispose} from 'external/gs_tools/src/testing';

import {CreateProjectView} from './create-project-view';
import {Project} from '../data/project';
import {Routes} from '../routing/routes';


describe('landing.CreateProjectView', () => {
  let mockProjectCollection;
  let mockRouteService;
  let view: CreateProjectView;

  beforeEach(() => {
    mockProjectCollection = jasmine.createSpyObj('ProjectCollection', ['reserveId', 'update']);
    mockRouteService = jasmine.createSpyObj('RouteService', ['goTo']);
    view = new CreateProjectView(
        Mocks.object('ThemeService'),
        mockProjectCollection,
        mockRouteService);
    TestDispose.add(view);
  });

  describe('onCancelAction_', () => {
    it('should navigate to the landing page', () => {
      let route = Mocks.object('route');
      spyOn(Routes.LANDING, 'create').and.returnValue(route);

      view['onCancelAction_']();

      assert(mockRouteService.goTo).to.haveBeenCalledWith(route);
    });
  });

  describe('onNameChange_', () => {
    it('should disable the create button if there are no names', () => {
      spyOn(view['nameValueBridge_'], 'get').and.returnValue('');
      spyOn(view['createButtonDisabledBridge_'], 'set');

      view['onNameChange_']();

      assert(view['createButtonDisabledBridge_'].set).to.haveBeenCalledWith(true);
    });

    it('should enable the create button if there are names', () => {
      spyOn(view['nameValueBridge_'], 'get').and.returnValue('name');
      spyOn(view['createButtonDisabledBridge_'], 'set');

      view['onNameChange_']();

      assert(view['createButtonDisabledBridge_'].set).to.haveBeenCalledWith(false);
    });
  });

  describe('onSubmitAction_', () => {
    it('should create the project correctly', (done: any) => {
      let projectId = 'projectId';
      mockProjectCollection.reserveId.and.returnValue(Promise.resolve(projectId));

      let projectName = 'projectName';

      spyOn(Project.prototype, 'setName');
      spyOn(view['nameValueBridge_'], 'get').and.returnValue(projectName);

      view['onSubmitAction_']()
          .then(() => {
            assert(mockProjectCollection.update).to.haveBeenCalledWith(Matchers.any(Project));

            let project = mockProjectCollection.update.calls.argsFor(0)[0];
            assert(project.setName).to.haveBeenCalledWith(projectName);
            assert(project.getId()).to.equal(projectId);
            done();
          }, done.fail);
    });

    it('should throw error if name is not set', () => {
      spyOn(view['nameValueBridge_'], 'get').and.returnValue(null);

      assert(() => {
        view['onSubmitAction_']();
      }).to.throwError(/Project name is not set/);
    });
  });
});
