import { assert, TestBase } from '../test-base';
TestBase.setup();

import { DataAccess, FakeDataAccess } from 'external/gs_tools/src/datamodel';
import { ImmutableMap } from 'external/gs_tools/src/immutable';
import { Mocks } from 'external/gs_tools/src/mock';

import { AssetManager } from '../data/asset-manager';
import { Asset2 } from '../data/asset2';
import { AssetMainRouteFactory } from '../routing/asset-main-route-factory';

describe('routing.AssetMainRouteFactory', () => {
  let factory: AssetMainRouteFactory;

  beforeEach(() => {
    factory = new AssetMainRouteFactory(Mocks.object('ParentRouteFactory'));
  });

  describe('getName', () => {
    it('should return a promise that resolves with the correct name', async () => {
      const assetId = 'assetId';
      const projectId = 'projectId';

      const assetName = 'assetName';
      const asset = Asset2.withId(assetId).setName(assetName);

      const fakeAssetAccess = new FakeDataAccess<Asset2>(ImmutableMap.of([[assetId, asset]]));
      spyOn(AssetManager, 'monad').and.returnValue(() => ({
        get(): DataAccess<Asset2> {
          return fakeAssetAccess;
        },
      }));

      const name = await factory.getName({assetId: assetId, projectId: projectId});
      assert(name).to.equal(assetName);
    });

    it('should return "Unknown asset" if the asset cannot be found', async () => {
      const fakeAssetAccess = new FakeDataAccess<Asset2>();
      spyOn(AssetManager, 'monad').and.returnValue(() => ({
        get(): DataAccess<Asset2> {
          return fakeAssetAccess;
        },
      }));

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
