import {assert, Matchers, TestBase} from '../test-base';
TestBase.setup();

import {Mocks} from 'external/gs_tools/src/mock';
import {TestDispose} from 'external/gs_tools/src/testing';

import {AssetCollection} from './asset-collection';
import {CollectionEvents} from './collection-events';


describe('data.AssetCollection', () => {
  let collection: AssetCollection;

  beforeEach(() => {
    collection = new AssetCollection(window);
    TestDispose.add(collection);
  });

  describe('reserveId', () => {
    it('should return the correct asset ID', (done: any) => {
      let projectId = 'projectId';
      let assetId = 'assetId';
      spyOn(collection['storage_'], 'generateId').and.returnValue(Promise.resolve(assetId));
      collection
          .reserveId(projectId)
          .then((id: string) => {
            assert(id).to.equal(`${projectId}_${assetId}`);
            done();
          }, done.fail);
    });
  });

  describe('update', () => {
    it('should persist the asset correctly and dispatch the ADDED event if the asset is new',
        (done: any) => {
          let assetId = 'assetId';
          let mockAsset = jasmine.createSpyObj('Asset', ['getId']);
          mockAsset.getId.and.returnValue(assetId);

          spyOn(collection['storage_'], 'read').and.returnValue(Promise.resolve(null));
          spyOn(collection['storage_'], 'update').and.returnValue(Promise.resolve());
          spyOn(collection, 'dispatch');

          collection
              .update(mockAsset)
              .then(() => {
                assert(collection.dispatch).to.haveBeenCalledWith(
                    CollectionEvents.ADDED,
                    <any> Matchers.any(Function),
                    mockAsset);
                assert(collection['storage_'].update).to.haveBeenCalledWith(assetId, mockAsset);
                assert(collection['storage_'].read).to.haveBeenCalledWith(assetId);
                done();
              }, done.fail);
        });

    it('should not dispatch the ADDED event if the asset is not new', (done: any) => {
      let assetId = 'assetId';
      let mockAsset = jasmine.createSpyObj('Asset', ['getId']);
      mockAsset.getId.and.returnValue(assetId);


      let existingAsset = Mocks.object('existingAsset');
      spyOn(collection['storage_'], 'read').and.returnValue(Promise.resolve(existingAsset));
      spyOn(collection['storage_'], 'update').and.returnValue(Promise.resolve());
          spyOn(collection, 'dispatch');

      collection
          .update(mockAsset)
          .then(() => {
            assert(collection.dispatch).toNot.haveBeenCalled();
            assert(collection['storage_'].update).to.haveBeenCalledWith(assetId, mockAsset);
            assert(collection['storage_'].read).to.haveBeenCalledWith(assetId);
            done();
          }, done.fail);
    });
  });
});
