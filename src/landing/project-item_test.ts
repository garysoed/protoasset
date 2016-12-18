import {assert, TestBase} from '../test-base';
TestBase.setup();

import {Mocks} from 'external/gs_tools/src/mock';
import {TestDispose} from 'external/gs_tools/src/testing';

import {ProjectItem} from './project-item';
import {Routes} from '../routing/routes';


describe('landing.ProjectItem', () => {
  let mockProjectCollection;
  let mockRouteService;
  let item;

  beforeEach(() => {
    mockProjectCollection = jasmine.createSpyObj('ProjectCollection', ['get']);
    mockRouteService = jasmine.createSpyObj('RouteService', ['goTo']);
    item = new ProjectItem(
        mockProjectCollection,
        mockRouteService,
        Mocks.object('ThemeService'));
    TestDispose.add(item);
  });

  describe('onElementClicked_', () => {
    it('should go to the correct project view', () => {
      let projectId = 'projectId';
      spyOn(item['projectIdBridge_'], 'get').and.returnValue(projectId);

      let projectRoute = Mocks.object('projectRoute');
      spyOn(Routes.PROJECT, 'create').and.returnValue(projectRoute);

      item['onElementClicked_']();

      assert(mockRouteService.goTo).to.haveBeenCalledWith(projectRoute);
      assert(Routes.PROJECT.create).to.haveBeenCalledWith(projectId);
    });

    it('should do nothing if the project ID is null', () => {
      spyOn(item['projectIdBridge_'], 'get').and.returnValue(null);

      item['onElementClicked_']();

      assert(mockRouteService.goTo).toNot.haveBeenCalled();
    });
  });

  describe('onProjectIdChanged_', () => {
    it('should set the project name correctly if found', (done: any) => {
      let projectId = 'projectId';
      let name = 'name';
      let mockProject = jasmine.createSpyObj('Project', ['getName']);
      mockProject.getName.and.returnValue(name);

      mockProjectCollection.get.and.returnValue(Promise.resolve(mockProject));

      spyOn(item['projectNameBridge_'], 'set');

      item['onProjectIdChanged_'](projectId)
          .then(() => {
            assert(mockProjectCollection.get).to.haveBeenCalledWith(projectId);
            assert(item['projectNameBridge_'].set).to.haveBeenCalledWith(name);
            done();
          }, done.fail);
    });

    it('should delete the project name if not found', (done: any) => {
      let projectId = 'projectId';

      mockProjectCollection.get.and.returnValue(Promise.resolve(null));

      spyOn(item['projectNameBridge_'], 'delete');

      item['onProjectIdChanged_'](projectId)
          .then(() => {
            assert(mockProjectCollection.get).to.haveBeenCalledWith(projectId);
            assert(item['projectNameBridge_'].delete).to.haveBeenCalledWith();
            done();
          }, done.fail);
    });
  });
});
