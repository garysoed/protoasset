import { assert, TestBase } from '../test-base';
TestBase.setup();

import { ImmutableSet } from 'external/gs_tools/src/immutable';
import { Mocks } from 'external/gs_tools/src/mock';

import { CollectionStorage } from '../data/collection-storage';


describe('project.CollectionStorage', () => {
  let mockGetSearchIndex: any;
  let mockStorage: any;
  let storage: CollectionStorage<any, any>;

  beforeEach(() => {
    mockGetSearchIndex = jasmine.createSpy('GetSearchIndex');
    mockStorage = jasmine.createSpyObj('Storage', ['generateId', 'list', 'read', 'update']);
    storage = new CollectionStorage(mockGetSearchIndex, mockStorage);
  });

  describe('getFusePromise_', () => {
    it('should return the correct fuse object', async () => {
      const item1 = Mocks.object('item1');
      const searchIndex1 = Mocks.object('searchIndex1');

      const item2 = Mocks.object('item2');
      const searchIndex2 = Mocks.object('searchIndex2');

      mockGetSearchIndex.and.callFake((item: any) => {
        switch (item) {
          case item1:
            return searchIndex1;
          case item2:
            return searchIndex2;
        }
      });
      spyOn(storage, 'list').and.returnValue(Promise.resolve(ImmutableSet.of([item1, item2])));

      const fuse = Mocks.object('fuse');
      spyOn(storage, 'createFuse_').and.returnValue(fuse);

      const actualFuse = await storage['getFusePromise_']();
      assert(actualFuse).to.equal(fuse);
      assert(storage['createFuse_']).to
          .haveBeenCalledWith(ImmutableSet.of([searchIndex1, searchIndex2]));
      assert(mockGetSearchIndex).to.haveBeenCalledWith(item1);
      assert(mockGetSearchIndex).to.haveBeenCalledWith(item2);
    });

    it('should return the cached fuse object', async () => {
      const fuse = Mocks.object('fuse');
      storage['fusePromise_'] = Promise.resolve(fuse);

      spyOn(storage, 'createFuse_');

      const actualFuse = await storage['getFusePromise_']();
      assert(actualFuse).to.equal(fuse);
      assert(storage['createFuse_']).toNot.haveBeenCalled();
      assert(mockGetSearchIndex).toNot.haveBeenCalled();
    });
  });

  describe('get', () => {
    it('should return the correct item', () => {
      const itemId = 'itemId';
      const promise = Mocks.object('promise');
      mockStorage.read.and.returnValue(promise);
      assert(storage.get(itemId)).to.equal(promise);
      assert(mockStorage.read).to.haveBeenCalledWith(itemId);
    });
  });

  describe('list', () => {
    it('should return the correct items', () => {
      const promise = Mocks.object('promise');
      mockStorage.list.and.returnValue(promise);
      assert(storage.list()).to.equal(promise);
      assert(mockStorage.list).to.haveBeenCalledWith();
    });
  });

  describe('reserveId', () => {
    it('should return the correct generated ID', () => {
      const promise = Mocks.object('promise');
      mockStorage.generateId.and.returnValue(promise);
      assert(storage.reserveId()).to.equal(promise);
      assert(mockStorage.generateId).to.haveBeenCalledWith();
    });
  });

  describe('search', () => {
    it('should return the correct result from fuse', async () => {
      const item1 = Mocks.object('item1');
      const item2 = Mocks.object('item2');
      const mockFuse = jasmine.createSpyObj('Fuse', ['search']);
      mockFuse.search.and.returnValue([
        {this: item1},
        {this: item2},
      ]);
      spyOn(storage, 'getFusePromise_').and.returnValue(Promise.resolve(mockFuse));

      const token = 'token';
      const results = await storage.search(token);
      assert(results).to.equal([item1, item2]);
      assert(mockFuse.search).to.haveBeenCalledWith(token);
    });
  });

  describe('update', () => {
    it('should update the storage, resolve true if the item is new, and clear the fuse cache',
        async () => {
          const item = Mocks.object('item');
          const itemId = 'itemId';

          mockStorage.update.and.returnValue(Promise.resolve());
          mockStorage.read.and.returnValue(Promise.resolve(null));

          const isNewItem = await storage.update(itemId, item);
          assert(isNewItem).to.beTrue();
          assert(storage['fusePromise_']).to.beNull();
          assert(mockStorage.update).to.haveBeenCalledWith(itemId, item);
          assert(mockStorage.read).to.haveBeenCalledWith(itemId);
        });

    it('should resolve false if the item is not new', async () => {
      mockStorage.update.and.returnValue(Promise.resolve());
      mockStorage.read.and.returnValue(Promise.resolve(Mocks.object('existingItem')));

      const isNewItem = await storage.update('itemId', Mocks.object('item'));
      assert(isNewItem).to.beFalse();
    });
  });
});
