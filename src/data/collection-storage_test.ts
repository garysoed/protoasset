import {assert, TestBase} from '../test-base';
TestBase.setup();

import {Mocks} from 'external/gs_tools/src/mock';

import {CollectionStorage} from './collection-storage';


describe('project.CollectionStorage', () => {
  let mockGetSearchIndex;
  let mockStorage;
  let storage: CollectionStorage<any, any>;

  beforeEach(() => {
    mockGetSearchIndex = jasmine.createSpy('GetSearchIndex');
    mockStorage = jasmine.createSpyObj('Storage', ['generateId', 'list', 'read', 'update']);
    storage = new CollectionStorage(mockGetSearchIndex, mockStorage);
  });

  describe('getFusePromise_', () => {
    it('should return the correct fuse object', (done: any) => {
      let item1 = Mocks.object('item1');
      let searchIndex1 = Mocks.object('searchIndex1');

      let item2 = Mocks.object('item2');
      let searchIndex2 = Mocks.object('searchIndex2');

      mockGetSearchIndex.and.callFake((item: any) => {
        switch (item) {
          case item1:
            return searchIndex1;
          case item2:
            return searchIndex2;
        }
      });
      spyOn(storage, 'list').and.returnValue(Promise.resolve([item1, item2]));

      let fuse = Mocks.object('fuse');
      spyOn(storage, 'createFuse_').and.returnValue(fuse);

      storage['getFusePromise_']()
          .then((actualFuse: any) => {
            assert(actualFuse).to.equal(fuse);
            assert(storage['createFuse_']).to.haveBeenCalledWith([searchIndex1, searchIndex2]);
            assert(mockGetSearchIndex).to.haveBeenCalledWith(item1);
            assert(mockGetSearchIndex).to.haveBeenCalledWith(item2);
            done();
          }, done.fail);
    });

    it('should return the cached fuse object', (done: any) => {
      let fuse = Mocks.object('fuse');
      storage['fusePromise_'] = Promise.resolve(fuse);

      spyOn(storage, 'createFuse_');

      storage['getFusePromise_']()
          .then((actualFuse: any) => {
            assert(actualFuse).to.equal(fuse);
            assert(storage['createFuse_']).toNot.haveBeenCalled();
            assert(mockGetSearchIndex).toNot.haveBeenCalled();
            done();
          }, done.fail);
    });
  });

  describe('get', () => {
    it('should return the correct item', () => {
      let itemId = 'itemId';
      let promise = Mocks.object('promise');
      mockStorage.read.and.returnValue(promise);
      assert(storage.get(itemId)).to.equal(promise);
      assert(mockStorage.read).to.haveBeenCalledWith(itemId);
    });
  });

  describe('list', () => {
    it('should return the correct items', () => {
      let promise = Mocks.object('promise');
      mockStorage.list.and.returnValue(promise);
      assert(storage.list()).to.equal(promise);
      assert(mockStorage.list).to.haveBeenCalledWith();
    });
  });

  describe('reserveId', () => {
    it('should return the correct generated ID', () => {
      let promise = Mocks.object('promise');
      mockStorage.generateId.and.returnValue(promise);
      assert(storage.reserveId()).to.equal(promise);
      assert(mockStorage.generateId).to.haveBeenCalledWith();
    });
  });

  describe('search', () => {
    it('should return the correct result from fuse', (done: any) => {
      let item1 = Mocks.object('item1');
      let item2 = Mocks.object('item2');
      let mockFuse = jasmine.createSpyObj('Fuse', ['search']);
      mockFuse.search.and.returnValue([
        {this: item1},
        {this: item2},
      ]);
      spyOn(storage, 'getFusePromise_').and.returnValue(Promise.resolve(mockFuse));

      let token = 'token';
      storage
          .search(token)
          .then((results: any) => {
            assert(results).to.equal([item1, item2]);
            assert(mockFuse.search).to.haveBeenCalledWith(token);
            done();
          }, done.fail);
    });
  });

  describe('update', () => {
    it('should update the storage, resolve true if the item is new, and clear the fuse cache',
        (done: any) => {
          let item = Mocks.object('item');
          let itemId = 'itemId';

          mockStorage.update.and.returnValue(Promise.resolve());
          mockStorage.read.and.returnValue(Promise.resolve(null));

          storage
              .update(itemId, item)
              .then((isNewItem: boolean) => {
                assert(isNewItem).to.beTrue();
                assert(storage['fusePromise_']).to.beNull();
                assert(mockStorage.update).to.haveBeenCalledWith(itemId, item);
                assert(mockStorage.read).to.haveBeenCalledWith(itemId);
                done();
              }, done.fail);
        });

    it('should resolve false if the item is not new', (done: any) => {
      mockStorage.update.and.returnValue(Promise.resolve());
      mockStorage.read.and.returnValue(Promise.resolve(Mocks.object('existingItem')));

      storage
          .update('itemId', Mocks.object('item'))
          .then((isNewItem: boolean) => {
            assert(isNewItem).to.beFalse();
            done();
          }, done.fail);
      });
  });
});
