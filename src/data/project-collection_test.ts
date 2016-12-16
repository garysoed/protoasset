import {assert, TestBase} from '../test-base';
TestBase.setup();

import {Mocks} from 'external/gs_tools/src/mock';
import {TestDispose} from 'external/gs_tools/src/testing';

import {Project} from './project';
import {ProjectCollection} from './project-collection';


describe('data.ProjectCollection', () => {
  let collection: ProjectCollection;

  beforeEach(() => {
    collection = new ProjectCollection(window);
    TestDispose.add(collection);
  });

  describe('getFusePromise_', () => {
    it('should return the correctly initialized fuse object', (done: any) => {
      let searchIndex1 = Mocks.object('searchIndex1');
      let mockProject1 = jasmine.createSpyObj('Project1', ['getSearchIndex']);
      mockProject1.getSearchIndex.and.returnValue(searchIndex1);

      let searchIndex2 = Mocks.object('searchIndex2');
      let mockProject2 = jasmine.createSpyObj('Project2', ['getSearchIndex']);
      mockProject2.getSearchIndex.and.returnValue(searchIndex2);

      let fuse = Mocks.object('fuse');
      spyOn(collection, 'createFuse_').and.returnValue(fuse);

      spyOn(collection, 'list').and.returnValue(Promise.resolve([mockProject1, mockProject2]));

      collection['getFusePromise_']()
          .then((actualFuse: any) => {
            assert(actualFuse).to.equal(fuse);
            assert(collection['createFuse_']).to.haveBeenCalledWith([searchIndex1, searchIndex2]);
            done();
          }, done.fail);
    });

    it('should reuse the existing fuse promise', () => {
      let fusePromise = Mocks.object('fusePromise');
      collection['fusePromise_'] = fusePromise;

      spyOn(collection, 'createFuse_');

      assert(collection['getFusePromise_']()).to.equal(fusePromise);
      assert(collection['createFuse_']).toNot.haveBeenCalled();
    });
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

  describe('search', () => {
    it('should return the correct projects', (done: any) => {
      let project1 = Mocks.object('project1');
      let result1 = Mocks.object('result1');
      result1.this = project1;

      let project2 = Mocks.object('project2');
      let result2 = Mocks.object('result2');
      result2.this = project2;

      let token = 'token';
      let mockFuse = jasmine.createSpyObj('Fuse', ['search']);
      mockFuse.search.and.returnValue([result1, result2]);

      spyOn(collection, 'getFusePromise_').and.returnValue(Promise.resolve(mockFuse));

      collection
          .search(token)
          .then((projects: Project[]) => {
            assert(projects).to.equal([project1, project2]);
            assert(mockFuse.search).to.haveBeenCalledWith(token);
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
            assert(collection['fusePromise_']).to.beNull();
            done();
          }, done.fail);
    });
  });
});
