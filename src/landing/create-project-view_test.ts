import { assert, Matchers, TestBase } from '../test-base';
TestBase.setup();

import { DataAccess, FakeDataAccess } from 'external/gs_tools/src/datamodel';
import { FakeMonadSetter } from 'external/gs_tools/src/event';
import { ImmutableMap } from 'external/gs_tools/src/immutable';
import { Mocks } from 'external/gs_tools/src/mock';
import { TestDispose } from 'external/gs_tools/src/testing';

import { FakeRouteFactoryService, FakeRouteNavigator } from 'external/gs_ui/src/routing';

import { Project } from '../data/project';
import { CreateProjectView } from '../landing/create-project-view';
import { Views } from '../routing/views';


describe('landing.CreateProjectView', () => {
  let mockRouteService: any;
  let view: CreateProjectView;

  beforeEach(() => {
    const fakeRouteFactoryService = FakeRouteFactoryService.create(ImmutableMap.of([
      ['assetList', Views.PROJECT],
      ['landing', Views.LANDING],
    ])) as any;
    mockRouteService = jasmine.createSpyObj('RouteService', ['goTo']);
    view = new CreateProjectView(
        Mocks.object('ThemeService'),
        fakeRouteFactoryService,
        mockRouteService);
    TestDispose.add(view);
  });

  describe('goToLanding_', () => {
    it('should navigate to the landing page', () => {
      const fakeRouteNavigator = new FakeRouteNavigator<Views>();
      const fakeRouteSetter = new FakeMonadSetter(fakeRouteNavigator);

      const updates = view.goToLanding_(fakeRouteSetter);
      assert(fakeRouteSetter.findValue(updates)!.value.getDestination()!).to.matchObject({
        params: {},
        type: Views.LANDING,
      });
    });
  });

  describe('onNameChange_', () => {
    it('should disable the create button if there are no names', () => {
      const fakeCreateButtonDisabledSetter = new FakeMonadSetter<boolean>(false);

      const list = view.onNameChange_('', fakeCreateButtonDisabledSetter);
      assert(fakeCreateButtonDisabledSetter.findValue(list)!.value).to.beTrue();
    });

    it('should enable the create button if there is a name', () => {
      const fakeCreateButtonDisabledSetter = new FakeMonadSetter<boolean>(true);

      const list = view.onNameChange_('Project Name', fakeCreateButtonDisabledSetter);
      assert(fakeCreateButtonDisabledSetter.findValue(list)!.value).to.beFalse();
    });
  });

  describe('onSubmitAction_', () => {
    it('should create the project correctly, reset, and redirect to project page',
    async () => {
      const projectId = 'projectId';

      const projectName = 'projectName';
      const projectNameSetter = Mocks.object('projectNameSetter');
      projectNameSetter.value = projectName;

      const projectAccess = new FakeDataAccess<Project>();
      const fakeProjectAccessSetter = new FakeMonadSetter<DataAccess<Project>>(projectAccess);

      const fakeRouteNavigator = new FakeRouteNavigator<Views>();
      const fakeRouteSetter = new FakeMonadSetter(fakeRouteNavigator);

      const updates = await view.onSubmitAction_(
          Promise.resolve(projectId),
          projectNameSetter,
          fakeProjectAccessSetter,
          fakeRouteSetter);
      assert(fakeRouteSetter.findValue(updates)!.value.getDestination()!).to.matchObject({
        params: {projectId},
        type: Views.PROJECT,
      });

      const projectUpdateQueue = fakeProjectAccessSetter.findValue(updates)!.value.getUpdateQueue();
      assert(projectUpdateQueue).to
          .haveElements([[projectId, Matchers.any<Project>(Project as any)]]);

      const project = projectUpdateQueue.get(projectId)!;
      assert(project.getName()).to.equal(projectName);
      assert(project.getId()).to.equal(projectId);
    });

    it('should reject if name is not set', async () => {
      const projectNameSetter = Mocks.object('prjectNameSetter');
      projectNameSetter.value = null;
      const projectAccess = Mocks.object('projectAccess');

      const fakeRouteNavigator = new FakeRouteNavigator<Views>();
      const fakeRouteSetter = new FakeMonadSetter(fakeRouteNavigator);

      const promise = view.onSubmitAction_(
          Promise.resolve('newId'),
          projectNameSetter,
          projectAccess,
          fakeRouteSetter);
      await assert(promise).to.rejectWithError(/Project name is not set/);
    });
  });

  describe('reset_', () => {
    it('should clear the name value', () => {
      const fakeProjectNameSetter = new FakeMonadSetter<string | null>(null);
      const list = view['reset_'](fakeProjectNameSetter);
      assert(fakeProjectNameSetter.findValue(list)!.value).to.equal('');
    });
  });
});
