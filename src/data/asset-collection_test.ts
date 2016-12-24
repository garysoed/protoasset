import {assert, Matchers, TestBase} from '../test-base';
TestBase.setup();

import {Mocks} from 'external/gs_tools/src/mock';
import {LocalStorage} from 'external/gs_tools/src/store';
import {TestDispose} from 'external/gs_tools/src/testing';

import {AssetCollection} from './asset-collection';
import {CollectionEvents} from './collection-events';


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
      let storage = Mocks.object('storage');
      spyOn(LocalStorage, 'of').and.returnValue(storage);

      let projectId = 'projectId';
      assert(collection['getStorage_'](projectId)).to.equal(storage);
      assert(collection['storageMap_']).to.haveEntries([[projectId, storage]]);
      assert(LocalStorage.of).to.haveBeenCalledWith(window, `pa.assets.${projectId}`);
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

  describe('reserveId', () => {
    it('should return the correct asset ID', (done: any) => {
      let projectId = 'projectId';
      let assetId = 'assetId';
      let mockStorage = jasmine.createSpyObj('Storage', ['generateId']);
      mockStorage.generateId.and.returnValue(Promise.resolve(assetId));
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
          let mockAsset = jasmine.createSpyObj('Asset', ['getId']);
          mockAsset.getId.and.returnValue(assetId);

          let mockStorage = jasmine.createSpyObj('Storage', ['read', 'update']);
          mockStorage.read.and.returnValue(Promise.resolve(null));
          mockStorage.update.and.returnValue(Promise.resolve());
          spyOn(collection, 'getStorage_').and.returnValue(mockStorage);

          spyOn(collection, 'dispatch');

          collection
              .update(mockAsset, projectId)
              .then(() => {
                assert(collection.dispatch).to.haveBeenCalledWith(
                    CollectionEvents.ADDED,
                    Matchers.anyInstanceOf(() => {}),
                    mockAsset);
                assert(mockStorage.update).to.haveBeenCalledWith(assetId, mockAsset);
                assert(mockStorage.read).to.haveBeenCalledWith(assetId);
                assert(collection['getStorage_']).to.haveBeenCalledWith(projectId);
                done();
              }, done.fail);
        });

    it('should not dispatch the ADDED event if the asset is not new', (done: any) => {
      let projectId = 'projectId';
      let assetId = 'assetId';
      let mockAsset = jasmine.createSpyObj('Asset', ['getId']);
      mockAsset.getId.and.returnValue(assetId);

      let existingAsset = Mocks.object('existingAsset');

      let mockStorage = jasmine.createSpyObj('Storage', ['read', 'update']);
      mockStorage.read.and.returnValue(Promise.resolve(existingAsset));
      mockStorage.update.and.returnValue(Promise.resolve());
      spyOn(collection, 'getStorage_').and.returnValue(mockStorage);
      spyOn(collection, 'dispatch');

      collection
          .update(mockAsset, projectId)
          .then(() => {
            assert(collection.dispatch).toNot.haveBeenCalled();
            assert(mockStorage.update).to.haveBeenCalledWith(assetId, mockAsset);
            assert(mockStorage.read).to.haveBeenCalledWith(assetId);
            assert(collection['getStorage_']).to.haveBeenCalledWith(projectId);
            done();
          }, done.fail);
    });
  });
});
