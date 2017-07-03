import { assert, TestBase } from '../test-base';
TestBase.setup();

import { Mocks } from 'external/gs_tools/src/mock';
import { TestDispose } from 'external/gs_tools/src/testing';

import { RouteServiceEvents } from 'external/gs_ui/src/routing';

import { SettingsView } from '../project/settings-view';

describe('project.SettingsView', () => {
  let mockProjectCollection: any;
  let mockRouteFactoryService: any;
  let mockRouteService: any;
  let view: SettingsView;

  beforeEach(() => {
    mockProjectCollection = jasmine.createSpyObj('ProjectCollection', ['get', 'update']);
    mockRouteFactoryService = jasmine.createSpyObj('RouteFactoryService', ['projectSettings']);
    mockRouteService = jasmine.createSpyObj('RouteService', ['getParams', 'on']);
    view = new SettingsView(
        mockProjectCollection,
        mockRouteFactoryService,
        mockRouteService,
        jasmine.createSpyObj('ThemeService', ['applyTheme']));
    TestDispose.add(view);
  });

  describe('getProject_', () => {
    it('should resolve the correct project', async () => {
      const project = Mocks.object('project');
      mockProjectCollection.get.and.returnValue(project);

      const projectId = 'projectId';
      mockRouteService.getParams.and.returnValue({projectId});

      const routeFactory = Mocks.object('routeFactory');
      mockRouteFactoryService.projectSettings.and.returnValue(routeFactory);

      assert(await view['getProject_']()).to.equal(project);
      assert(mockProjectCollection.get).to.haveBeenCalledWith(projectId);
      assert(mockRouteService.getParams).to.haveBeenCalledWith(routeFactory);
    });

    it('should resolve with null if params cannot be determined', async () => {
      mockRouteService.getParams.and.returnValue(null);

      const routeFactory = Mocks.object('routeFactory');
      mockRouteFactoryService.projectSettings.and.returnValue(routeFactory);

      assert(await view['getProject_']()).to.equal(null);
      assert(mockRouteService.getParams).to.haveBeenCalledWith(routeFactory);
    });
  });

  describe('onCreated', () => {
    it('should initialize correctly', () => {
      spyOn(view, 'onRouteChanged_');
      spyOn(view, 'listenTo');
      spyOn(view, 'addDisposable').and.callThrough();

      const mockDisposable = jasmine.createSpyObj('Disposable', ['dispose']);
      mockRouteService.on.and.returnValue(mockDisposable);

      view.onCreated(Mocks.object('element'));
      assert(view['onRouteChanged_']).to.haveBeenCalledWith();
      assert(view.addDisposable).to.haveBeenCalledWith(mockDisposable);
      assert(mockRouteService.on).to.haveBeenCalledWith(
          RouteServiceEvents.CHANGED,
          view['onRouteChanged_'],
          view);
    });
  });

  describe('onEditorProjectNameChanged_', () => {
    it('should update the project correctly', async () => {
      const mockProject = jasmine.createSpyObj('Project', ['setName']);
      spyOn(view, 'getProject_').and.returnValue(Promise.resolve(mockProject));

      const projectName = 'projectName';
      spyOn(view.editorProjectNameHook_, 'get').and.returnValue(projectName);

      await view.onEditorProjectNameChanged_();
      assert(mockProjectCollection.update).to.haveBeenCalledWith(mockProject);
      assert(mockProject.setName).to.haveBeenCalledWith(projectName);
    });

    it('should do nothing if the editor project name is null', async () => {
      const mockProject = jasmine.createSpyObj('Project', ['setName']);
      spyOn(view, 'getProject_').and.returnValue(Promise.resolve(mockProject));

      spyOn(view.editorProjectNameHook_, 'get').and.returnValue(null);

      await view.onEditorProjectNameChanged_();
      assert(mockProjectCollection.update).toNot.haveBeenCalled();
      assert(mockProject.setName).toNot.haveBeenCalled();
    });

    it('should do nothing if the project cannot be found', async () => {
      spyOn(view, 'getProject_').and.returnValue(Promise.resolve(null));

      await view.onEditorProjectNameChanged_();
      assert(mockProjectCollection.update).toNot.haveBeenCalled();
    });
  });

  describe('onRouteChanged_', () => {
    it('should update the UI correctly', async () => {
      const projectName = 'projectName';
      const mockProject = jasmine.createSpyObj('Project', ['getName']);
      mockProject.getName.and.returnValue(projectName);
      spyOn(view, 'getProject_').and.returnValue(Promise.resolve(mockProject));
      spyOn(view.editorProjectNameHook_, 'set');
      spyOn(view.nameInnerTextHook_, 'set');

      await view['onRouteChanged_']();
      assert(view.editorProjectNameHook_.set).to.haveBeenCalledWith(projectName);
      assert(view.nameInnerTextHook_.set).to.haveBeenCalledWith(projectName);
    });

    it('should do nothing if project cannot be found', async () => {
      spyOn(view, 'getProject_').and.returnValue(Promise.resolve(null));
      spyOn(view.editorProjectNameHook_, 'set');
      spyOn(view.nameInnerTextHook_, 'set');

      await view['onRouteChanged_']();
      assert(view.editorProjectNameHook_.set).toNot.haveBeenCalled();
      assert(view.nameInnerTextHook_.set).toNot.haveBeenCalled();
    });
  });
});
