import {assert, TestBase} from '../test-base';
TestBase.setup();

import {Mocks} from 'external/gs_tools/src/mock';

import {AssetMainRouteFactory} from './asset-main-route-factory';


describe('routing.AssetMainRouteFactory', () => {
  let mockAssetCollection;
  let factory: AssetMainRouteFactory;

  beforeEach(() => {
    mockAssetCollection = jasmine.createSpyObj('AssetCollection', ['get']);
    factory = new AssetMainRouteFactory(mockAssetCollection, Mocks.object('ParentRouteFactory'));
  });

  describe('getName', () => {
    it('should return a promise that resolves with the correct name', (done: any) => {
      let assetId = 'assetId';
      let projectId = 'projectId';

      let assetName = 'assetName';
      let mockAsset = jasmine.createSpyObj('Asset', ['getName']);
      mockAsset.getName.and.returnValue(assetName);

      mockAssetCollection.get.and.returnValue(Promise.resolve(mockAsset));

      factory.getName({assetId: assetId, projectId: projectId})
          .then((name: string) => {
            assert(name).to.equal(assetName);
            assert(mockAssetCollection.get).to.haveBeenCalledWith(projectId, assetId);
            done();
          }, done.fail);
    });

    it('should return "Unknown asset" if the asset cannot be found', (done: any) => {
      mockAssetCollection.get.and.returnValue(Promise.resolve(null));

      factory.getName({assetId: 'assetId', projectId: 'projectId'})
          .then((name: string) => {
            assert(name).to.equal('Unknown asset');
            done();
          }, done.fail);
    });
  });
});