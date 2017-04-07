import { assert, TestBase } from '../test-base';
TestBase.setup();

import { Mocks } from 'external/gs_tools/src/mock';

import { AssetSettingsRouteFactory } from './asset-settings-route-factory';


describe('routing.AssetSettingsRouteFactory', () => {
  let mockAssetCollection;
  let factory: AssetSettingsRouteFactory;

  beforeEach(() => {
    mockAssetCollection = jasmine.createSpyObj('AssetCollection', ['get']);
    factory = new AssetSettingsRouteFactory(
        mockAssetCollection,
        Mocks.object('parentRouteFactory'));
  });

  describe('getName', () => {
    it('should resolve with the correct name', async () => {
      const assetId = 'assetId';
      const projectId = 'projectId';
      const assetName = 'assetName';
      const mockAsset = jasmine.createSpyObj('Asset', ['getName']);
      mockAsset.getName.and.returnValue(assetName);
      mockAssetCollection.get.and.returnValue(Promise.resolve(mockAsset));
      assert(await factory.getName({assetId, projectId})).to.equal(`Settings for ${assetName}`);
      assert(mockAssetCollection.get).to.haveBeenCalledWith(projectId, assetId);
    });

    it('should resolve with the correct name if asset cannot be found', async () => {
      const assetId = 'assetId';
      const projectId = 'projectId';
      mockAssetCollection.get.and.returnValue(Promise.resolve(null));
      assert(await factory.getName({assetId, projectId})).to.equal(`Settings`);
      assert(mockAssetCollection.get).to.haveBeenCalledWith(projectId, assetId);
    });
  });
});
