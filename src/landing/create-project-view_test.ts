import {assert, Matchers, TestBase} from '../test-base';
TestBase.setup();

import {Mocks} from 'external/gs_tools/src/mock';
import {TestDispose} from 'external/gs_tools/src/testing';

import {Project} from '../data/project';

import {CreateProjectView} from './create-project-view';


describe('landing.CreateProjectView', () => {
  let mockProjectCollection;
  let mockRouteFactoryService;
  let mockRouteService;
  let view: CreateProjectView;

  beforeEach(() => {
    mockProjectCollection = jasmine.createSpyObj('ProjectCollection', ['reserveId', 'update']);
    mockRouteFactoryService = jasmine.createSpyObj('RouteFactoryService', ['assetList', 'landing']);
    mockRouteService = jasmine.createSpyObj('RouteService', ['goTo']);
    view = new CreateProjectView(
        Mocks.object('ThemeService'),
        mockProjectCollection,
        mockRouteFactoryService,
        mockRouteService);
    TestDispose.add(view);
  });

  describe('reset_', () => {
    it('should clear the name value', () => {
      spyOn(view['nameValueBridge_'], 'set');
      view['reset_']();
      assert(view['nameValueBridge_'].set).to.haveBeenCalledWith('');
    });
  });

  describe('onCancelAction_', () => {
    it('should navigate to the landing page', () => {
      let routeFactory = Mocks.object('routeFactory');
      mockRouteFactoryService.landing.and.returnValue(routeFactory);

      spyOn(view, 'reset_');

      view['onCancelAction_']();

      assert(mockRouteService.goTo).to.haveBeenCalledWith(routeFactory, {});
      assert(view['reset_']).to.haveBeenCalledWith();
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
    it('should create the project correctly, reset, and redirect to project page',
    async (done: any) => {
      let projectId = 'projectId';
      mockProjectCollection.reserveId.and.returnValue(Promise.resolve(projectId));

      let projectName = 'projectName';

      let routeFactory = Mocks.object('routeFactory');
      mockRouteFactoryService.assetList.and.returnValue(routeFactory);

      spyOn(Project.prototype, 'setName');
      spyOn(view['nameValueBridge_'], 'get').and.returnValue(projectName);
      spyOn(view, 'reset_');

      await view['onSubmitAction_']();
      assert(mockProjectCollection.update).to.haveBeenCalledWith(Matchers.any(Project));

      let project = mockProjectCollection.update.calls.argsFor(0)[0];
      assert(project.setName).to.haveBeenCalledWith(projectName);
      assert(project.getId()).to.equal(projectId);

      assert(view['reset_']).to.haveBeenCalledWith();
      assert(mockRouteService.goTo).to
          .haveBeenCalledWith(routeFactory, {projectId: projectId});
    });

    it('should reject if name is not set', async (done: any) => {
      spyOn(view['nameValueBridge_'], 'get').and.returnValue(null);

      try {
        await view['onSubmitAction_']();
        done.fail();
      } catch (e) {
        const error: Error = e;
        assert(error.message).to.equal(Matchers.stringMatching(/Project name is not set/));
      }
    });
  });
});
