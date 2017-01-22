import {assert, Matchers, TestBase} from '../test-base';
TestBase.setup();

import {Mocks} from 'external/gs_tools/src/mock';
import {CachedStorage, LocalStorage} from 'external/gs_tools/src/store';
import {TestDispose} from 'external/gs_tools/src/testing';

import {AssetCollection} from './asset-collection';
import {CollectionEvents} from './collection-events';
import {CollectionStorage} from './collection-storage';


describe('data.AssetCollection', () => {
  let window;
  let collection: AssetCollection;

  beforeEach(() => {
    window = Mocks.object('window');
    collection = new AssetCollection(window);
    TestDispose.add(collection);
  });

  describe('getStorage_', () => {
    it('should create a new storage if one does not exist', () => {
      let collectionStorage = Mocks.object('collectionStorage');
      spyOn(CollectionStorage, 'of').and.returnValue(collectionStorage);

      let localStorage = Mocks.object('storage');
      spyOn(LocalStorage, 'of').and.returnValue(localStorage);

      let mockCachedStorage = jasmine.createSpyObj('CachedStorage', ['dispose']);
      spyOn(CachedStorage, 'of').and.returnValue(mockCachedStorage);

      let projectId = 'projectId';
      assert(collection['getStorage_'](projectId)).to.equal(collectionStorage);
      assert(collection['storageMap_']).to.haveEntries([[projectId, collectionStorage]]);
      assert(LocalStorage.of).to.haveBeenCalledWith(window, `pa.assets.${projectId}`);
      assert(CachedStorage.of).to.haveBeenCalledWith(localStorage);
      assert(CollectionStorage.of).to
          .haveBeenCalledWith(AssetCollection['getSearchIndex_'], mockCachedStorage);
    });

    it('should return an existing storage if one exists', () => {
      let storage = Mocks.object('storage');
      let projectId = 'projectId';
      collection['storageMap_'].set(projectId, storage);

      spyOn(LocalStorage, 'of');

      assert(collection['getStorage_'](projectId)).to.equal(storage);
      assert(LocalStorage.of).toNot.haveBeenCalled();
    });
  });

  describe('get', () => {
    it('should return the correct asset', (done: any) => {
      let asset = Mocks.object('asset');
      let mockStorage = jasmine.createSpyObj('Storage', ['get']);
      mockStorage.get.and.returnValue(Promise.resolve(asset));
      spyOn(collection, 'getStorage_').and.returnValue(mockStorage);

      let projectId = 'projectId';
      let assetId = 'assetId';

      collection
          .get(projectId, assetId)
          .then((actualAsset: any) => {
            assert(actualAsset).to.equal(asset);
            assert(mockStorage.get).to.haveBeenCalledWith(assetId);
            assert(collection['getStorage_']).to.haveBeenCalledWith(projectId);
            done();
          }, done.fail);
    });
  });

  describe('list', () => {
    it('should return the correct assets', (done: any) => {
      let assets = Mocks.object('assets');
      let mockStorage = jasmine.createSpyObj('Storage', ['list']);
      mockStorage.list.and.returnValue(Promise.resolve(assets));
      spyOn(collection, 'getStorage_').and.returnValue(mockStorage);

      let projectId = 'projectId';

      collection
          .list(projectId)
          .then((actualAssets: any) => {
            assert(actualAssets).to.equal(assets);
            assert(collection['getStorage_']).to.haveBeenCalledWith(projectId);
            done();
          }, done.fail);
    });
  });

  describe('search', () => {
    it('should return the correct assets', (done: any) => {
      let assets = Mocks.object('assets');
      let mockStorage = jasmine.createSpyObj('Storage', ['search']);
      mockStorage.search.and.returnValue(Promise.resolve(assets));
      spyOn(collection, 'getStorage_').and.returnValue(mockStorage);

      let projectId = 'projectId';
      let token = 'token';

      collection
          .search(projectId, token)
          .then((actualAssets: any) => {
            assert(actualAssets).to.equal(assets);
            assert(mockStorage.search).to.haveBeenCalledWith(token);
            assert(collection['getStorage_']).to.haveBeenCalledWith(projectId);
            done();
          }, done.fail);
    });
  });

  describe('reserveId', () => {
    it('should return the correct asset ID', (done: any) => {
      let projectId = 'projectId';
      let assetId = 'assetId';
      let mockStorage = jasmine.createSpyObj('Storage', ['reserveId']);
      mockStorage.reserveId.and.returnValue(Promise.resolve(assetId));
      spyOn(collection, 'getStorage_').and.returnValue(mockStorage);

      collection
          .reserveId(projectId)
          .then((id: string) => {
            assert(id).to.equal(assetId);
            assert(collection['getStorage_']).to.haveBeenCalledWith(projectId);
            done();
          }, done.fail);
    });
  });

  describe('update', () => {
    it('should persist the asset correctly and dispatch the ADDED event if the asset is new',
        (done: any) => {
          let projectId = 'projectId';
          let assetId = 'assetId';
          let mockAsset = jasmine.createSpyObj('Asset', ['getId', 'getProjectId']);
          mockAsset.getId.and.returnValue(assetId);
          mockAsset.getProjectId.and.returnValue(projectId);

          let mockStorage = jasmine.createSpyObj('Storage', ['read', 'update']);
          mockStorage.update.and.returnValue(Promise.resolve(true));
          spyOn(collection, 'getStorage_').and.returnValue(mockStorage);
          spyOn(collection, 'dispatch');

          collection
              .update(mockAsset)
              .then(() => {
                assert(collection.dispatch).to.haveBeenCalledWith(
                    CollectionEvents.ADDED,
                    Matchers.anyInstanceOf(() => {}),
                    mockAsset);
                assert(mockStorage.update).to.haveBeenCalledWith(assetId, mockAsset);
                assert(collection['getStorage_']).to.haveBeenCalledWith(projectId);
                done();
              }, done.fail);
        });

    it('should not dispatch the ADDED event if the asset is not new', (done: any) => {
      let mockAsset = jasmine.createSpyObj('Asset', ['getId', 'getProjectId']);
      mockAsset.getProjectId.and.returnValue('projectId');
      mockAsset.getId.and.returnValue('assetId');

      let mockStorage = jasmine.createSpyObj('Storage', ['update']);
      mockStorage.update.and.returnValue(Promise.resolve(false));
      spyOn(collection, 'getStorage_').and.returnValue(mockStorage);
      spyOn(collection, 'dispatch');

      collection
          .update(mockAsset)
          .then(() => {
            assert(collection.dispatch).toNot.haveBeenCalled();
            done();
          }, done.fail);
    });
  });

  describe('getSearchIndex_', () => {
    it('should return the correct search index', () => {
      let searchIndex = Mocks.object('searchIndex');
      let mockAsset = jasmine.createSpyObj('Asset', ['getSearchIndex']);
      mockAsset.getSearchIndex.and.returnValue(searchIndex);
      assert(AssetCollection['getSearchIndex_'](mockAsset)).to.equal(searchIndex);
    });
  });
});
