import {assert, Matchers, TestBase} from '../test-base';
TestBase.setup();

import {Mocks} from 'external/gs_tools/src/mock';
import {TestDispose} from 'external/gs_tools/src/testing';

import {CollectionEvents} from './collection-events';
import {Project} from './project';
import {ProjectCollection} from './project-collection';


describe('data.ProjectCollection', () => {
  let collection: ProjectCollection;

  beforeEach(() => {
    collection = new ProjectCollection(window);
    TestDispose.add(collection);
  });

  describe('get', () => {
    it('should return the value returned by the storage', () => {
      let projectId = 'projectId';
      let promise = Mocks.object('promise');
      spyOn(collection['storage_'], 'get').and.returnValue(promise);

      assert(collection.get(projectId)).to.equal(promise);
      assert(collection['storage_'].get).to.haveBeenCalledWith(projectId);
    });
  });

  describe('list', () => {
    it('should return the correct projects', (done: any) => {
      let projects = Mocks.object('projects');

      spyOn(collection['storage_'], 'list').and.returnValue(Promise.resolve(projects));

      collection
          .list()
          .then((actualProjects: Project[]) => {
            assert(actualProjects).to.equal(projects);
            assert(collection['storage_'].list).to.haveBeenCalledWith();
            done();
          }, done.fail);
    });
  });

  describe('reserveId', () => {
    it('should return a promise that is resolved with the correct project ID', (done: any) => {
      let projectId = 'projectId';

      spyOn(collection['storage_'], 'reserveId').and.returnValue(Promise.resolve(projectId));

      collection
          .reserveId()
          .then((actualId: string) => {
            assert(actualId).to.equal(projectId);
            assert(collection['storage_'].reserveId).to.haveBeenCalledWith();
            done();
          }, done.fail);
    });
  });

  describe('search', () => {
    it('should return the correct projects', (done: any) => {
      let projects = Mocks.object('projects');

      spyOn(collection['storage_'], 'search').and.returnValue(Promise.resolve(projects));

      let token = 'token';
      collection
          .search(token)
          .then((actualProjects: Project[]) => {
            assert(actualProjects).to.equal(projects);
            assert(collection['storage_'].search).to.haveBeenCalledWith(token);
            done();
          }, done.fail);
    });
  });

  describe('update', () => {
    it('should update the project correctly', (done: any) => {
      let projectId = 'projectId';
      let mockProject = jasmine.createSpyObj('Project', ['getId']);
      mockProject.getId.and.returnValue(projectId);

      spyOn(collection, 'dispatch');
      spyOn(collection['storage_'], 'update').and.returnValue(Promise.resolve(true));

      collection
          .update(mockProject)
          .then(() => {
            assert(collection['storage_'].update).to.haveBeenCalledWith(projectId, mockProject);
            assert(collection.dispatch).to.haveBeenCalledWith(
                CollectionEvents.ADDED,
                <any> Matchers.any(Function),
                mockProject);
            done();
          }, done.fail);
    });

    it('should not dispatch the ADDED event if not a new project', (done: any) => {
      let projectId = 'projectId';
      let mockProject = jasmine.createSpyObj('Project', ['getId']);
      mockProject.getId.and.returnValue(projectId);

      spyOn(collection, 'dispatch');
      spyOn(collection['storage_'], 'update').and.returnValue(Promise.resolve(false));

      collection
          .update(mockProject)
          .then(() => {
            assert(collection.dispatch).toNot.haveBeenCalled();
            done();
          }, done.fail);
    });
  });

  describe('getSearchIndex_', () => {
    it('should return the correct search index', () => {
      let searchIndex = Mocks.object('searchIndex');
      let mockProject = jasmine.createSpyObj('Project', ['getSearchIndex']);
      mockProject.getSearchIndex.and.returnValue(searchIndex);
      assert(ProjectCollection['getSearchIndex_'](mockProject)).to.equal(searchIndex);
    });
  });
});
