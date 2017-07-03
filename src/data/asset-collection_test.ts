import { assert, Matchers, TestBase } from '../test-base';
TestBase.setup();

import { Mocks } from 'external/gs_tools/src/mock';
import { CachedStorage, LocalStorage } from 'external/gs_tools/src/store';
import { TestDispose } from 'external/gs_tools/src/testing';

import { AssetCollection } from './asset-collection';
import { CollectionEvents } from './collection-events';
import { CollectionStorage } from './collection-storage';


describe('data.AssetCollection', () => {
  let window: any;
  let collection: AssetCollection;

  beforeEach(() => {
    window = Mocks.object('window');
    collection = new AssetCollection(window);
    TestDispose.add(collection);
  });

  describe('getStorage_', () => {
    it('should create a new storage if one does not exist', () => {
      const collectionStorage = Mocks.object('collectionStorage');
      spyOn(CollectionStorage, 'of').and.returnValue(collectionStorage);

      const localStorage = Mocks.object('storage');
      spyOn(LocalStorage, 'of').and.returnValue(localStorage);

      const mockCachedStorage = jasmine.createSpyObj('CachedStorage', ['dispose']);
      spyOn(CachedStorage, 'of').and.returnValue(mockCachedStorage);

      const projectId = 'projectId';
      assert(collection['getStorage_'](projectId)).to.equal(collectionStorage);
      assert(collection['storageMap_']).to.haveEntries([[projectId, collectionStorage]]);
      assert(LocalStorage.of).to.haveBeenCalledWith(window, `pa.assets.${projectId}`);
      assert(CachedStorage.of).to.haveBeenCalledWith(localStorage);
      assert(CollectionStorage.of).to
          .haveBeenCalledWith(AssetCollection['getSearchIndex_'], mockCachedStorage);
    });

    it('should return an existing storage if one exists', () => {
      const storage = Mocks.object('storage');
      const projectId = 'projectId';
      collection['storageMap_'].set(projectId, storage);

      spyOn(LocalStorage, 'of');

      assert(collection['getStorage_'](projectId)).to.equal(storage);
      assert(LocalStorage.of).toNot.haveBeenCalled();
    });
  });

  describe('get', () => {
    it('should return the correct asset', async () => {
      const asset = Mocks.object('asset');
      const mockStorage = jasmine.createSpyObj('Storage', ['get']);
      mockStorage.get.and.returnValue(Promise.resolve(asset));
      spyOn(collection, 'getStorage_').and.returnValue(mockStorage);

      const projectId = 'projectId';
      const assetId = 'assetId';

      const actualAsset = await collection.get(projectId, assetId);
      assert(actualAsset).to.equal(asset);
      assert(mockStorage.get).to.haveBeenCalledWith(assetId);
      assert(collection['getStorage_']).to.haveBeenCalledWith(projectId);
    });
  });

  describe('list', () => {
    it('should return the correct assets', async () => {
      const assets = Mocks.object('assets');
      const mockStorage = jasmine.createSpyObj('Storage', ['list']);
      mockStorage.list.and.returnValue(Promise.resolve(assets));
      spyOn(collection, 'getStorage_').and.returnValue(mockStorage);

      const projectId = 'projectId';

      const actualAssets = await collection.list(projectId);
      assert(actualAssets).to.equal(assets);
      assert(collection['getStorage_']).to.haveBeenCalledWith(projectId);
    });
  });

  describe('search', () => {
    it('should return the correct assets', async () => {
      const assets = Mocks.object('assets');
      const mockStorage = jasmine.createSpyObj('Storage', ['search']);
      mockStorage.search.and.returnValue(Promise.resolve(assets));
      spyOn(collection, 'getStorage_').and.returnValue(mockStorage);

      const projectId = 'projectId';
      const token = 'token';

      const actualAssets = await collection.search(projectId, token);
      assert(actualAssets).to.equal(assets);
      assert(mockStorage.search).to.haveBeenCalledWith(token);
      assert(collection['getStorage_']).to.haveBeenCalledWith(projectId);
    });
  });

  describe('reserveId', () => {
    it('should return the correct asset ID', async () => {
      const projectId = 'projectId';
      const assetId = 'assetId';
      const mockStorage = jasmine.createSpyObj('Storage', ['reserveId']);
      mockStorage.reserveId.and.returnValue(Promise.resolve(assetId));
      spyOn(collection, 'getStorage_').and.returnValue(mockStorage);

      const id = await collection.reserveId(projectId);
      assert(id).to.equal(assetId);
      assert(collection['getStorage_']).to.haveBeenCalledWith(projectId);
    });
  });

  describe('update', () => {
    it('should persist the asset correctly and dispatch the ADDED event if the asset is new',
        async () => {
          const projectId = 'projectId';
          const assetId = 'assetId';
          const mockAsset = jasmine.createSpyObj('Asset', ['getId', 'getProjectId']);
          mockAsset.getId.and.returnValue(assetId);
          mockAsset.getProjectId.and.returnValue(projectId);

          const mockStorage = jasmine.createSpyObj('Storage', ['read', 'update']);
          mockStorage.update.and.returnValue(Promise.resolve(true));
          spyOn(collection, 'getStorage_').and.returnValue(mockStorage);
          spyOn(collection, 'dispatch');

          await collection.update(mockAsset);
          assert(collection.dispatch).to.haveBeenCalledWith(
              CollectionEvents.ADDED,
              Matchers.anyInstanceOf(() => {}),
              mockAsset);
          assert(mockStorage.update).to.haveBeenCalledWith(assetId, mockAsset);
          assert(collection['getStorage_']).to.haveBeenCalledWith(projectId);
        });

    it('should not dispatch the ADDED event if the asset is not new', async () => {
      const mockAsset = jasmine.createSpyObj('Asset', ['getId', 'getProjectId']);
      mockAsset.getProjectId.and.returnValue('projectId');
      mockAsset.getId.and.returnValue('assetId');

      const mockStorage = jasmine.createSpyObj('Storage', ['update']);
      mockStorage.update.and.returnValue(Promise.resolve(false));
      spyOn(collection, 'getStorage_').and.returnValue(mockStorage);
      spyOn(collection, 'dispatch');

      await collection.update(mockAsset);
      assert(collection.dispatch).toNot.haveBeenCalled();
    });
  });

  describe('getSearchIndex_', () => {
    it('should return the correct search index', () => {
      const searchIndex = Mocks.object('searchIndex');
      const mockAsset = jasmine.createSpyObj('Asset', ['getSearchIndex']);
      mockAsset.getSearchIndex.and.returnValue(searchIndex);
      assert(AssetCollection['getSearchIndex_'](mockAsset)).to.equal(searchIndex);
    });
  });
});
