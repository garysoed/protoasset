import { assert, TestBase } from '../test-base';
TestBase.setup();

import { DataAccess, FakeDataAccess } from 'external/gs_tools/src/datamodel';
import { FakeMonadSetter } from 'external/gs_tools/src/event';
import { ImmutableMap } from 'external/gs_tools/src/immutable';
import { Mocks } from 'external/gs_tools/src/mock';
import { TestDispose } from 'external/gs_tools/src/testing';

import { FakeRouteNavigator } from 'external/gs_ui/src/routing';

import { Project } from '../data/project';
import { SettingsView } from '../project/settings-view';
import { TestRouteFactoryService } from '../routing/test-route-factory-service';
import { Views } from '../routing/views';

describe('project.SettingsView', () => {
  let mockDownloadService: any;
  let view: SettingsView;

  beforeEach(() => {
    mockDownloadService = jasmine.createSpyObj('DownloadService', ['downloadString']);
    view = new SettingsView(
        mockDownloadService,
        TestRouteFactoryService,
        Mocks.object('RouteService'),
        jasmine.createSpyObj('ThemeService', ['applyTheme']));
    TestDispose.add(view);
  });

  describe('getProject_', () => {
    it('should resolve the correct project', async () => {
      const projectId = 'projectId';
      const project = Project.withId(projectId);

      const projectDataAccess = new FakeDataAccess(
        ImmutableMap.of([[projectId, project]]),
      );

      const fakeRouteNavigator = new FakeRouteNavigator<Views>();
      spyOn(fakeRouteNavigator, 'getRoute').and.returnValue({params: {projectId}});

      assert(await view['getProject_'](fakeRouteNavigator, projectDataAccess)).to.equal(project);
      assert(fakeRouteNavigator.getRoute).to
          .haveBeenCalledWith(TestRouteFactoryService.projectSettings());
    });

    it('should resolve with null if route cannot be determined', async () => {
      const projectDataAccess = new FakeDataAccess<Project>();

      const fakeRouteNavigator = new FakeRouteNavigator<Views>();
      spyOn(fakeRouteNavigator, 'getRoute').and.returnValue(null);

      assert(await view['getProject_'](fakeRouteNavigator, projectDataAccess)).to.beNull();
      assert(fakeRouteNavigator.getRoute).to
          .haveBeenCalledWith(TestRouteFactoryService.projectSettings());
    });
  });

  describe('onEditorProjectNameChanged_', () => {
    it('should update the project correctly', async () => {
      const projectId = 'projectId';
      const mockProject = Project.withId(projectId);
      spyOn(view, 'getProject_').and.returnValue(Promise.resolve(mockProject));

      const projectName = 'projectName';
      const projectDataAccess = new FakeDataAccess<Project>();
      const fakeRouteNavigator = new FakeRouteNavigator<Views>();
      const fakeProjectSetter = new FakeMonadSetter<DataAccess<Project>>(projectDataAccess);

      const updates = await view.onEditorProjectNameChanged_(
          projectName,
          fakeRouteNavigator,
          fakeProjectSetter);
      const newProject = fakeProjectSetter
          .findValue(updates)!.value.getUpdateQueue().get(projectId)!;
      assert(newProject.getName()).to.equal(projectName);
      assert(view['getProject_']).to.haveBeenCalledWith(fakeRouteNavigator, projectDataAccess);
    });

    it('should do nothing if the project cannot be found', async () => {
      spyOn(view, 'getProject_').and.returnValue(Promise.resolve(null));

      const projectName = 'projectName';
      const projectDataAccess = new FakeDataAccess<Project>();
      const fakeRouteNavigator = new FakeRouteNavigator<Views>();
      const fakeProjectSetter = new FakeMonadSetter<DataAccess<Project>>(projectDataAccess);

      const updates = await view.onEditorProjectNameChanged_(
          projectName,
          fakeRouteNavigator,
          fakeProjectSetter);
      assert(updates).to.equal([]);
    });

    it('should do nothing if the editor project name is null', async () => {
      const projectName = 'projectName';
      const projectDataAccess = new FakeDataAccess<Project>();
      const fakeRouteNavigator = new FakeRouteNavigator<Views>();
      const fakeProjectSetter = new FakeMonadSetter<DataAccess<Project>>(projectDataAccess);

      const updates = await view.onEditorProjectNameChanged_(
          projectName,
          fakeRouteNavigator,
          fakeProjectSetter);
      assert(updates).to.equal([]);
    });
  });

  describe('onRouteChanged_', () => {
    it('should update the UI correctly', async () => {
      const projectName = 'projectName';
      const project = Project.withId('projectId').setName(projectName);
      spyOn(view, 'getProject_').and.returnValue(Promise.resolve(project));

      const projectAccess = new FakeDataAccess<Project>();
      const fakeEditorNameSetter = new FakeMonadSetter<string | null>(null);
      const fakeNameSetter = new FakeMonadSetter<string | null>(null);
      const fakeRouteNavigator = new FakeRouteNavigator<Views>();

      const updates = await view.onRouteChanged_(
          fakeRouteNavigator,
          projectAccess,
          fakeEditorNameSetter,
          fakeNameSetter);
      assert(fakeEditorNameSetter.findValue(updates)!.value).to.equal(projectName);
      assert(fakeNameSetter.findValue(updates)!.value).to.equal(projectName);
      assert(view['getProject_']).to.haveBeenCalledWith(fakeRouteNavigator, projectAccess);
    });

    it('should do nothing if project cannot be found', async () => {
      spyOn(view, 'getProject_').and.returnValue(Promise.resolve(null));

      const projectAccess = new FakeDataAccess<Project>();
      const fakeEditorNameSetter = new FakeMonadSetter<string | null>(null);
      const fakeNameSetter = new FakeMonadSetter<string | null>(null);
      const fakeRouteNavigator = new FakeRouteNavigator<Views>();

      const updates = await view.onRouteChanged_(
          fakeRouteNavigator,
          projectAccess,
          fakeEditorNameSetter,
          fakeNameSetter);
      assert(updates).to.equal([]);
    });
  });
});
