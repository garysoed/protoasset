import { assert, Matchers, TestBase } from '../test-base';
TestBase.setup();

import { DataAccess, FakeDataAccess } from 'external/gs_tools/src/datamodel';
import { ImmutableMap } from 'external/gs_tools/src/immutable';
import { Mocks } from 'external/gs_tools/src/mock';
import { TestDispose } from 'external/gs_tools/src/testing';

import { Project } from '../data/project';
import { CreateProjectView } from '../landing/create-project-view';


describe('landing.CreateProjectView', () => {
  let mockRouteFactoryService: any;
  let mockRouteService: any;
  let view: CreateProjectView;

  beforeEach(() => {
    mockRouteFactoryService = jasmine.createSpyObj('RouteFactoryService', ['assetList', 'landing']);
    mockRouteService = jasmine.createSpyObj('RouteService', ['goTo']);
    view = new CreateProjectView(
        Mocks.object('ThemeService'),
        mockRouteFactoryService,
        mockRouteService);
    TestDispose.add(view);
  });

  describe('onCancelAction_', () => {
    it('should navigate to the landing page', () => {
      const routeFactory = Mocks.object('routeFactory');
      mockRouteFactoryService.landing.and.returnValue(routeFactory);

      const projectNameSetter = Mocks.object('projectNameSetter');
      const resetMap = Mocks.object('resetMap');
      spyOn(view, 'reset_').and.returnValue(resetMap);

      assert(view.onCancelAction_(projectNameSetter)).to.equal(resetMap);
      assert(view['reset_']).to.haveBeenCalledWith(projectNameSetter);
      assert(mockRouteService.goTo).to.haveBeenCalledWith(routeFactory, {});
    });
  });

  describe('onNameChange_', () => {
    it('should disable the create button if there are no names', () => {
      const createButtonId = 'createButtonId';

      assert(view.onNameChange_('', {id: createButtonId} as any)).to
          .haveElements([[createButtonId, true]]);
    });

    it('should enable the create button if there is a name', () => {
      const createButtonId = 'createButtonId';

      assert(view.onNameChange_('Project Name', {id: createButtonId} as any)).to
          .haveElements([[createButtonId, false]]);
    });
  });

  describe('onSubmitAction_', () => {
    it('should create the project correctly, reset, and redirect to project page',
    async () => {
      const projectId = 'projectId';
      const projectAccessId = 'projectAccessId';

      const routeFactory = Mocks.object('routeFactory');
      mockRouteFactoryService.assetList.and.returnValue(routeFactory);

      const resetId = 'resetId';
      const resetValue = Mocks.object('resetValue');
      spyOn(view, 'reset_').and.returnValue(ImmutableMap.of([[resetId, resetValue]]));

      const projectName = 'projectName';
      const projectNameSetter = Mocks.object('projectNameSetter');
      projectNameSetter.value = projectName;

      const projectAccess = new FakeDataAccess<Project>();
      const map = await view.onSubmitAction_(
          projectId,
          projectNameSetter,
          {id: projectAccessId, value: projectAccess});
      assert(map).to.haveElements([
        [resetId, resetValue],
        [projectAccessId, Matchers.any(DataAccess)],
      ]);

      const projectUpdateQueue = (map.get(projectAccessId) as DataAccess<Project>)
          .getUpdateQueue();
      assert(projectUpdateQueue).to
          .haveElements([[projectId, Matchers.any<Project>(Project as any)]]);

      const project = projectUpdateQueue.get(projectId)!;
      assert(project.getName()).to.equal(projectName);
      // TODO: Support this.
      // assert(project.getId()).to.equal(projectId);

      assert(view['reset_']).to.haveBeenCalledWith(projectNameSetter);
      assert(mockRouteService.goTo).to
          .haveBeenCalledWith(routeFactory, {projectId: projectId});
    });

    it('should reject if name is not set', async () => {
      const projectNameSetter = Mocks.object('prjectNameSetter');
      projectNameSetter.value = null;
      const projectAccess = Mocks.object('projectAccess');

      await assert(view.onSubmitAction_('newId', projectNameSetter, projectAccess)).to
          .rejectWithError(/Project name is not set/);
    });
  });

  describe('reset_', () => {
    it('should clear the name value', () => {
      const projectNameId = 'projectNameId';
      assert(view['reset_']({id: projectNameId} as any)).to.haveElements([[projectNameId, '']]);
    });
  });
});
