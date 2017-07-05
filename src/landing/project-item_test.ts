import { assert, TestBase } from '../test-base';
TestBase.setup();

import { Mocks } from 'external/gs_tools/src/mock';
import { TestDispose } from 'external/gs_tools/src/testing';

import { ProjectItem } from './project-item';


describe('landing.ProjectItem', () => {
  let mockRouteFactoryService: any;
  let mockRouteService: any;
  let item: ProjectItem;

  beforeEach(() => {
    mockRouteFactoryService = jasmine.createSpyObj('RouteFactoryService', ['assetList']);
    mockRouteService = jasmine.createSpyObj('RouteService', ['goTo']);
    item = new ProjectItem(
        mockRouteFactoryService,
        mockRouteService,
        Mocks.object('ThemeService'));
    TestDispose.add(item);
  });

  describe('onElementClicked_', () => {
    it('should go to the correct project view', () => {
      const projectId = 'projectId';

      const routeFactory = Mocks.object('routeFactory');
      mockRouteFactoryService.assetList.and.returnValue(routeFactory);

      item.onElementClicked_(projectId);

      assert(mockRouteService.goTo).to.haveBeenCalledWith(routeFactory, {projectId: projectId});
    });

    it('should do nothing if the project ID is null', () => {
      item.onElementClicked_(null);

      assert(mockRouteService.goTo).toNot.haveBeenCalled();
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
