import { assert, Matchers, TestBase } from '../test-base';
TestBase.setup();

import { DataAccess, FakeDataAccess } from 'external/gs_tools/src/datamodel';
import { FakeMonadSetter } from 'external/gs_tools/src/event';
import { ImmutableList } from 'external/gs_tools/src/immutable';
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

      const routeFactory = Mocks.object('routeFactory');
      mockRouteFactoryService.assetList.and.returnValue(routeFactory);

      const resetValue = Mocks.object('resetValue');
      spyOn(view, 'reset_').and.returnValue(ImmutableList.of([resetValue]));

      const projectName = 'projectName';
      const projectNameSetter = Mocks.object('projectNameSetter');
      projectNameSetter.value = projectName;

      const projectAccess = new FakeDataAccess<Project>();
      const fakeProjectAccessSetter = new FakeMonadSetter<DataAccess<Project>>(projectAccess);
      const list = await view.onSubmitAction_(
          Promise.resolve(projectId),
          projectNameSetter,
          fakeProjectAccessSetter);
      assert(list).to.startWith([resetValue]);

      const projectUpdateQueue = fakeProjectAccessSetter.findValue(list)!.value.getUpdateQueue();
      assert(projectUpdateQueue).to
          .haveElements([[projectId, Matchers.any<Project>(Project as any)]]);

      const project = projectUpdateQueue.get(projectId)!;
      assert(project.getName()).to.equal(projectName);
      assert(project.getId()).to.equal(projectId);

      assert(view['reset_']).to.haveBeenCalledWith(projectNameSetter);
      assert(mockRouteService.goTo).to
          .haveBeenCalledWith(routeFactory, {projectId: projectId});
    });

    it('should reject if name is not set', async () => {
      const projectNameSetter = Mocks.object('prjectNameSetter');
      projectNameSetter.value = null;
      const projectAccess = Mocks.object('projectAccess');

      const promise = view.onSubmitAction_(
        Promise.resolve('newId'),
        projectNameSetter,
        projectAccess);
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
