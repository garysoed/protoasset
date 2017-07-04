import { assert, Matchers, Mocks, TestBase } from '../test-base';
TestBase.setup();

import { ImmutableMap, ImmutableSet } from 'external/gs_tools/src/immutable';
import { Storage as GsStorage } from 'external/gs_tools/src/store';
import { TestDispose } from 'external/gs_tools/src/testing';

import { DataAccess } from '../data/data-access';
import { Manager } from '../data/manager';

class TestManager extends Manager<any, any> {
  constructor(storage: GsStorage<any>) {
    super(storage, Mocks.object('logger'));
  }
}

describe('data.Manager', () => {
  let mockStorage: any;
  let manager: TestManager;

  beforeEach(() => {
    mockStorage = jasmine.createSpyObj('Storage', ['generateId', 'read', 'list', 'update']);
    manager = new TestManager(mockStorage);
    TestDispose.add(manager);
  });

  describe('get_', () => {
    it('should return the value returned by the storage', async () => {
      const id = 'id';
      const value = Mocks.object('value');
      mockStorage.read.and.returnValue(Promise.resolve(value));

      assert(await manager['get_'](id)).to.equal(value);
      assert(mockStorage.read).to.haveBeenCalledWith(id);
    });
  });

  describe('getFusePromise_', () => {
    it('should return the correct fuse object', async () => {
      const mockItem1 = jasmine.createSpyObj('Item1', ['getSearchIndex']);
      const searchIndex1 = Mocks.object('searchIndex1');
      mockItem1.getSearchIndex.and.returnValue(searchIndex1);

      const mockItem2 = jasmine.createSpyObj('Item2', ['getSearchIndex']);
      const searchIndex2 = Mocks.object('searchIndex2');
      mockItem2.getSearchIndex.and.returnValue(searchIndex2);

      spyOn(manager, 'list_').and
          .returnValue(Promise.resolve(ImmutableSet.of([mockItem1, mockItem2])));

      const fuse = Mocks.object('fuse');
      spyOn(manager, 'createFuse_').and.returnValue(fuse);

      assert(await manager['getFusePromise_']()).to.equal(fuse);
      assert(manager['createFuse_']).to
          .haveBeenCalledWith(ImmutableSet.of([searchIndex1, searchIndex2]));
    });

    it('should return the cached fuse object', async () => {
      const fuse = Mocks.object('fuse');
      manager['fusePromise_'] = Promise.resolve(fuse);

      spyOn(manager, 'createFuse_');

      assert(await manager['getFusePromise_']()).to.equal(fuse);
      assert(manager['createFuse_']).toNot.haveBeenCalled();
    });
  });

  describe('idMonad', () => {
    it(`should return monad with the correct get method`, async () => {
      const itemId = 'itemId';

      mockStorage.generateId.and.returnValue(Promise.resolve(itemId));
      const monad = manager.idMonad();
      assert(await monad.get()).to.equal(itemId);

      mockStorage.generateId.calls.reset();
      assert(await monad.get()).to.equal(itemId);
      assert(mockStorage.generateId).toNot.haveBeenCalled();
    });
  });

  describe('list_', () => {
    it('should return the correct projects', async () => {
      const value1 = Mocks.object('value1');
      const value2 = Mocks.object('value2');

      mockStorage.list.and.returnValue(Promise.resolve(ImmutableSet.of([value1, value2])));

      assert(await manager['list_']()).to.haveElements([value1, value2]);
    });
  });

  describe('monad', () => {
    it(`should return monad with the correct get method`, () => {
      assert(manager.monad().get()).to.equal(Matchers.any(DataAccess));
    });

    it(`should return monad with the correct set method`, async () => {
      const item1 = Mocks.object('item1');
      const id1 = 'id1';

      const item2 = Mocks.object('item2');
      const id2 = 'id2';

      const mockDataAccess = jasmine.createSpyObj('DataAccess', ['getUpdateQueue']);
      mockDataAccess.getUpdateQueue.and.returnValue(ImmutableMap.of([[id1, item1], [id2, item2]]));

      spyOn(manager, 'update_');

      await manager.monad().set(mockDataAccess);
      assert(manager['update_']).to.haveBeenCalledWith(id1, item1);
      assert(manager['update_']).to.haveBeenCalledWith(id2, item2);
    });
  });

  describe('search_', () => {
    it('should return the correct items', async () => {
      const item1 = Mocks.object('item1');
      const item2 = Mocks.object('item2');
      const mockFuse = jasmine.createSpyObj('Fuse', ['search']);
      mockFuse.search.and.returnValue([{this: item1}, {this: item2}]);

      spyOn(manager, 'getFusePromise_').and.returnValue(Promise.resolve(mockFuse));

      const token = 'token';
      assert(await manager['search_'](token)).to.haveElements([item1, item2]);
      assert(mockFuse.search).to.haveBeenCalledWith(token);
    });
  });

  describe('update_', () => {
    it(`should update the item and dispatch the 'add' event if new`, async () => {
      const id = 'id';
      const item = Mocks.object('item');

      manager['fusePromise_'] = Mocks.object('Promise');
      mockStorage.read.and.returnValue(null);
      spyOn(manager, 'dispatch');

      await manager['update_'](id, item);
      assert(manager['fusePromise_']).to.beNull();
      assert(manager.dispatch).to.haveBeenCalledWith({data: item, type: 'add'});
      assert(mockStorage.update).to.haveBeenCalledWith(id, item);
      assert(mockStorage.read).to.haveBeenCalledWith(id);
    });

    it(`should update the item and dispatch the 'edit' event if not new`, async () => {
      const id = 'id';
      const item = Mocks.object('item');

      manager['fusePromise_'] = Mocks.object('Promise');
      mockStorage.read.and.returnValue(Mocks.object('OldItem'));
      spyOn(manager, 'dispatch');

      await manager['update_'](id, item);
      assert(manager['fusePromise_']).to.beNull();
      assert(manager.dispatch).to.haveBeenCalledWith({data: item, type: 'edit'});
      assert(mockStorage.update).to.haveBeenCalledWith(id, item);
      assert(mockStorage.read).to.haveBeenCalledWith(id);
    });
  });
});
