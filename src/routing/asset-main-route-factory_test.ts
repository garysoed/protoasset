import { assert, TestBase } from '../test-base';
TestBase.setup();

import { ImmutableMap } from 'external/gs_tools/src/immutable';
import { Mocks } from 'external/gs_tools/src/mock';

import { AssetMainRouteFactory } from '../routing/asset-main-route-factory';


describe('routing.AssetMainRouteFactory', () => {
  let mockAssetCollection;
  let factory: AssetMainRouteFactory;

  beforeEach(() => {
    mockAssetCollection = jasmine.createSpyObj('AssetCollection', ['get']);
    factory = new AssetMainRouteFactory(mockAssetCollection, Mocks.object('ParentRouteFactory'));
  });

  describe('getName', () => {
    it('should return a promise that resolves with the correct name', async () => {
      const assetId = 'assetId';
      const projectId = 'projectId';

      const assetName = 'assetName';
      const mockAsset = jasmine.createSpyObj('Asset', ['getName']);
      mockAsset.getName.and.returnValue(assetName);

      mockAssetCollection.get.and.returnValue(Promise.resolve(mockAsset));

      const name = await factory.getName({assetId: assetId, projectId: projectId});
      assert(name).to.equal(assetName);
      assert(mockAssetCollection.get).to.haveBeenCalledWith(projectId, assetId);
    });

    it('should return "Unknown asset" if the asset cannot be found', async () => {
      mockAssetCollection.get.and.returnValue(Promise.resolve(null));

      const name = await factory.getName({assetId: 'assetId', projectId: 'projectId'});
      assert(name).to.equal('Unknown asset');
    });
  });

  describe('getRelativeMatchParams_', () => {
    it('should return the correct object', () => {
      const assetId = 'assetId';
      assert(factory['getRelativeMatchParams_'](ImmutableMap.of([['assetId', assetId]])))
          .to.equal({assetId});
    });

    it('should throw error if assetId is not found', () => {
      assert(() => {
        factory['getRelativeMatchParams_'](ImmutableMap.of([[]]));
      }).to.throwError(/expected assetId/i);
    });
  });
});
