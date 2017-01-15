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
    it('should resolve with the correct name', (done: any) => {
      let assetId = 'assetId';
      let helperId = 'helperId';
      let projectId = 'projectId';

      let name = 'name';
      let mockHelper = jasmine.createSpyObj('Helper', ['getName']);
      mockHelper.getName.and.returnValue(name);

      let mockAsset = jasmine.createSpyObj('Asset', ['getHelpers']);
      mockAsset.getHelpers.and.returnValue({[helperId]: mockHelper});
      mockAssetCollection.get.and.returnValue(Promise.resolve(mockAsset));

      factory
          .getName({assetId: assetId, helperId: helperId, projectId: projectId})
          .then((actualName: string) => {
            assert(actualName).to.equal(name);
            assert(mockAssetCollection.get).to.haveBeenCalledWith(projectId, assetId);
            done();
          }, done.fail);
    });

    it('should resolve with "Unknown helper" if the helper cannot be found', (done: any) => {
      let mockAsset = jasmine.createSpyObj('Asset', ['getHelpers']);
      mockAsset.getHelpers.and.returnValue({'otherHelperId': Mocks.object('Helper')});
      mockAssetCollection.get.and.returnValue(Promise.resolve(mockAsset));

      factory
          .getName({assetId: 'assetId', helperId: 'helperId', projectId: 'projectId'})
          .then((actualName: string) => {
            assert(actualName).to.match(/Unknown helper/);
            done();
          }, done.fail);
    });

    it('should resolve with "Unknown helper for asset" if the asset cannot be found',
        (done: any) => {
          mockAssetCollection.get.and.returnValue(Promise.resolve(null));

          factory
              .getName({assetId: 'assetId', helperId: 'helperId', projectId: 'projectId'})
              .then((actualName: string) => {
                assert(actualName).to.match(/Unknown helper for asset/);
                done();
              }, done.fail);
        });
  });
});
