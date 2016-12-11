import {assert, TestBase} from '../test-base';
TestBase.setup();

import {Mocks} from 'external/gs_tools/src/mock';
import {TestDispose} from 'external/gs_tools/src/testing';

import {ProjectItem} from './project-item';


describe('landing.ProjectItem', () => {
  let mockProjectCollection;
  let item;

  beforeEach(() => {
    mockProjectCollection = jasmine.createSpyObj('ProjectCollection', ['get']);
    item = new ProjectItem(
        mockProjectCollection,
        Mocks.object('ThemeService'));
    TestDispose.add(item);
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
