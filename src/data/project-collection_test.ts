import {assert, TestBase} from '../test-base';
TestBase.setup();

import {Mocks} from 'external/gs_tools/src/mock';

import {ProjectCollection} from './project-collection';


describe('data.ProjectCollection', () => {
  let collection: ProjectCollection;

  beforeEach(() => {
    collection = new ProjectCollection(window);
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
});
