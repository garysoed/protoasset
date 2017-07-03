import { assert, TestBase } from '../test-base';
TestBase.setup();

import { ImmutableMap } from 'external/gs_tools/src/immutable';
import { Mocks } from 'external/gs_tools/src/mock';

import { HelperRouteFactory } from '../routing/helper-route-factory';


describe('routing.HelperRouteFactory', () => {
  let mockAssetCollection: any;
  let factory: HelperRouteFactory;

  beforeEach(() => {
    mockAssetCollection = jasmine.createSpyObj('AssetCollection', ['get']);
    factory = new HelperRouteFactory(
        mockAssetCollection,
        Mocks.object('parent'));
  });

  describe('getName', () => {
    it('should resolve with the correct name', async () => {
      const assetId = 'assetId';
      const helperId = 'helperId';
      const projectId = 'projectId';

      const name = 'name';
      const mockHelper = jasmine.createSpyObj('Helper', ['getName']);
      mockHelper.getName.and.returnValue(name);

      const mockAsset = jasmine.createSpyObj('Asset', ['getHelper']);
      mockAsset.getHelper.and.returnValue(mockHelper);
      mockAssetCollection.get.and.returnValue(Promise.resolve(mockAsset));

      const actualName = await factory
          .getName({assetId: assetId, helperId: helperId, projectId: projectId});
      assert(actualName).to.equal(name);
      assert(mockAssetCollection.get).to.haveBeenCalledWith(projectId, assetId);
      assert(mockAsset.getHelper).to.haveBeenCalledWith(helperId);
    });

    it('should resolve with "Unknown helper" if the helper cannot be found', async () => {
      const mockAsset = jasmine.createSpyObj('Asset', ['getHelper']);
      mockAsset.getHelper.and.returnValue(null);
      mockAssetCollection.get.and.returnValue(Promise.resolve(mockAsset));

      const helperId = 'helperId';

      const actualName = await factory
          .getName({assetId: 'assetId', helperId: helperId, projectId: 'projectId'});
      assert(actualName).to.match(/Unknown helper/);
      assert(mockAsset.getHelper).to.haveBeenCalledWith(helperId);
    });

    it('should resolve with "Unknown helper for asset" if the asset cannot be found',
        async () => {
          mockAssetCollection.get.and.returnValue(Promise.resolve(null));

          const actualName = await factory
              .getName({assetId: 'assetId', helperId: 'helperId', projectId: 'projectId'});
          assert(actualName).to.match(/Unknown helper for asset/);
        });
  });

  describe('getRelativeMatchParams_', () => {
    it('should return the correct object', () => {
      const helperId = 'helperId';
      assert(factory['getRelativeMatchParams_'](ImmutableMap.of([['helperId', helperId]])))
          .to.equal({helperId});
    });

    it('should throw error if helperId is not found', () => {
      assert(() => {
        factory['getRelativeMatchParams_'](ImmutableMap.of([[]]));
      }).to.throwError(/expected helperId/i);
    });
  });
});
