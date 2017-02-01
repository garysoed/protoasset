import {assert, TestBase} from '../test-base';
TestBase.setup();

import {Mocks} from 'external/gs_tools/src/mock';

import {HelperRouteFactory} from './helper-route-factory';


describe('routing.HelperRouteFactory', () => {
  let mockAssetCollection;
  let factory: HelperRouteFactory;

  beforeEach(() => {
    mockAssetCollection = jasmine.createSpyObj('AssetCollection', ['get']);
    factory = new HelperRouteFactory(
        mockAssetCollection,
        Mocks.object('parent'));
  });

  describe('getName', () => {
    it('should resolve with the correct name', async (done: any) => {
      let assetId = 'assetId';
      let helperId = 'helperId';
      let projectId = 'projectId';

      let name = 'name';
      let mockHelper = jasmine.createSpyObj('Helper', ['getName']);
      mockHelper.getName.and.returnValue(name);

      let mockAsset = jasmine.createSpyObj('Asset', ['getHelper']);
      mockAsset.getHelper.and.returnValue(mockHelper);
      mockAssetCollection.get.and.returnValue(Promise.resolve(mockAsset));

      let actualName = await factory
          .getName({assetId: assetId, helperId: helperId, projectId: projectId});
      assert(actualName).to.equal(name);
      assert(mockAssetCollection.get).to.haveBeenCalledWith(projectId, assetId);
      assert(mockAsset.getHelper).to.haveBeenCalledWith(helperId);
    });

    it('should resolve with "Unknown helper" if the helper cannot be found', async (done: any) => {
      let mockAsset = jasmine.createSpyObj('Asset', ['getHelper']);
      mockAsset.getHelper.and.returnValue(null);
      mockAssetCollection.get.and.returnValue(Promise.resolve(mockAsset));

      let helperId = 'helperId';

      let actualName = await factory
          .getName({assetId: 'assetId', helperId: helperId, projectId: 'projectId'});
      assert(actualName).to.match(/Unknown helper/);
      assert(mockAsset.getHelper).to.haveBeenCalledWith(helperId);
    });

    it('should resolve with "Unknown helper for asset" if the asset cannot be found',
        async (done: any) => {
          mockAssetCollection.get.and.returnValue(Promise.resolve(null));

          let actualName = await factory
              .getName({assetId: 'assetId', helperId: 'helperId', projectId: 'projectId'});
          assert(actualName).to.match(/Unknown helper for asset/);
        });
  });
});
