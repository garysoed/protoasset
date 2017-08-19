import { assert, TestBase } from '../test-base';
TestBase.setup();

import { FakeMonadSetter } from 'external/gs_tools/src/event';
import { Mocks } from 'external/gs_tools/src/mock';
import { TestDispose } from 'external/gs_tools/src/testing';

import { FakeRouteNavigator, RouteNavigator } from 'external/gs_ui/src/routing';

import { ProjectItem } from '../landing/project-item';
import { TestRouteFactoryService } from '../routing/test-route-factory-service';
import { Views } from '../routing/views';


describe('landing.ProjectItem', () => {
  let mockRouteService: any;
  let item: ProjectItem;

  beforeEach(() => {
    mockRouteService = jasmine.createSpyObj('RouteService', ['goTo']);
    item = new ProjectItem(
        TestRouteFactoryService,
        mockRouteService,
        Mocks.object('ThemeService'));
    TestDispose.add(item);
  });

  describe('onElementClicked_', () => {
    it('should go to the correct project view', () => {
      const projectId = 'projectId';
      const fakeRouteNavigator = new FakeRouteNavigator<Views>();
      const fakeRouteSetter = new FakeMonadSetter<RouteNavigator<Views>>(fakeRouteNavigator);

      const updates = item.onElementClicked_(projectId, fakeRouteSetter);
      assert(fakeRouteSetter.findValue(updates)!.value.getDestination()).to.matchObject({
        params: {projectId},
        type: Views.PROJECT,
      });
    });

    it('should do nothing if the project ID is null', () => {
      const fakeRouteNavigator = new FakeRouteNavigator<Views>();
      const fakeRouteSetter = new FakeMonadSetter<RouteNavigator<Views>>(fakeRouteNavigator);

      assert(item.onElementClicked_(null, fakeRouteSetter)).to.equal([]);
    });
  });

  describe('onProjectIdChanged_', () => {
    it('should set the project name correctly if found', async () => {
      const projectId = 'projectId';
      const name = 'name';
      const mockProject = jasmine.createSpyObj('Project', ['getName']);
      mockProject.getName.and.returnValue(name);

      const projectNameEl = document.createElement('div');

      const mockProjectAccess = jasmine.createSpyObj('ProjectAccess', ['get']);
      mockProjectAccess.get.and.returnValue(Promise.resolve(mockProject));

      await item.onProjectIdChanged_(projectNameEl, projectId, mockProjectAccess);
      assert(mockProjectAccess.get).to.haveBeenCalledWith(projectId);
      assert(projectNameEl.innerText).to.equal(name);
    });

    it('should delete the project name if not found', async () => {
      const projectId = 'projectId';
      const projectNameEl = document.createElement('div');
      projectNameEl.innerText = 'old project';

      const mockProjectAccess = jasmine.createSpyObj('ProjectAccess', ['get']);
      mockProjectAccess.get.and.returnValue(Promise.resolve(null));

      await item.onProjectIdChanged_(projectNameEl, projectId, mockProjectAccess);
      assert(mockProjectAccess.get).to.haveBeenCalledWith(projectId);
      assert(projectNameEl.innerText).to.equal('');
    });
  });
});
