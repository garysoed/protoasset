import {assert, TestBase} from '../test-base';
TestBase.setup();

import {Mocks} from 'external/gs_tools/src/mock';

import {ProjectCollection} from './project-collection';


describe('data.ProjectCollection', () => {
  let collection: ProjectCollection;

  beforeEach(() => {
    collection = new ProjectCollection(window);
  });

  describe('get', () => {
    it('should return the value returned by the storage', () => {
      let projectId = 'projectId';
      let promise = Mocks.object('promise');
      spyOn(collection['storage_'], 'read').and.returnValue(promise);

      assert(collection.get(projectId)).to.equal(promise);
      assert(collection['storage_'].read).to.haveBeenCalledWith(projectId);
    });
  });

  describe('list', () => {
    it('should return the correct projects', (done: any) => {
      let project1 = Mocks.object('project1');
      let project2 = Mocks.object('project2');
      let id1 = 'id1';
      let id2 = 'id2';

      spyOn(collection['storage_'], 'list').and.returnValue(Promise.resolve([id1, id2]));
      spyOn(collection['storage_'], 'read').and.callFake((id: string) => {
        switch (id) {
          case id1:
            return Promise.resolve(project1);
          case id2:
            return Promise.resolve(project2);
        }
      });

      collection
          .list()
          .then((projects: any[]) => {
            assert(projects).to.equal([project1, project2]);
            assert(collection['storage_'].read).to.haveBeenCalledWith(id1);
            assert(collection['storage_'].read).to.haveBeenCalledWith(id2);
            done();
          }, done.fail);
    });

    it('should skip null projects', (done: any) => {
      let id = 'id';

      spyOn(collection['storage_'], 'list').and.returnValue(Promise.resolve([id]));
      spyOn(collection['storage_'], 'read').and.returnValue(Promise.resolve(null));

      collection
          .list()
          .then((projects: any[]) => {
            assert(projects).to.equal([]);
            assert(collection['storage_'].read).to.haveBeenCalledWith(id);
            done();
          }, done.fail);
    });
  });

  describe('reserveId', () => {
    it('should return a promise that is resolved with the correct project ID', (done: any) => {
      let projectId = 'projectId';
      spyOn(collection['storage_'], 'reserve').and.returnValue(Promise.resolve(projectId));
      collection
          .reserveId()
          .then((result: string) => {
            assert(result).to.equal(projectId);
            done();
          }, done.fail);
    });
  });

  describe('update', () => {
    it('should update the project correctly', (done: any) => {
      let projectId = 'projectId';
      let mockProject = jasmine.createSpyObj('Project', ['getId']);
      mockProject.getId.and.returnValue(projectId);

      spyOn(collection['storage_'], 'update').and.returnValue(Promise.resolve());

      collection
          .update(mockProject)
          .then(() => {
            assert(collection['storage_'].update).to.haveBeenCalledWith(projectId, mockProject);
            done();
          }, done.fail);
    });
  });
});
