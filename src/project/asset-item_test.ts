import { assert, TestBase } from '../test-base';
TestBase.setup();

import { FakeDataAccess } from 'external/gs_tools/src/datamodel';
import { FakeMonadSetter } from 'external/gs_tools/src/event';
import { ImmutableMap } from 'external/gs_tools/src/immutable';
import { Mocks } from 'external/gs_tools/src/mock';
import { TestDispose } from 'external/gs_tools/src/testing';

import { FakeRouteFactory, FakeRouteNavigator, RouteNavigator } from 'external/gs_ui/src/routing';
import { Views } from 'src/routing/views';
import { Asset2 } from '../data/asset2';
import { AssetItem } from './asset-item';


describe('project.AssetItem', () => {
  let mockRouteFactoryService: any;
  let mockRouteService: any;
  let item: AssetItem;

  beforeEach(() => {
    mockRouteFactoryService = jasmine.createSpyObj('RouteFactoryService', ['assetMain']);
    mockRouteService = jasmine.createSpyObj('RouteService', ['goTo']);
    item = new AssetItem(
        mockRouteFactoryService,
        mockRouteService,
        Mocks.object('ThemeService'));
    TestDispose.add(item);
  });

  describe('onElementclicked_', () => {
    it('should navigate to asset main view', () => {
      const assetId = 'assetId';
      const projectId = 'projectId';

      const assetMainFactory = new FakeRouteFactory<Views>(Views.ASSET_MAIN);
      mockRouteFactoryService.assetMain.and.returnValue(assetMainFactory);

      const fakeRouteNavigator = new FakeRouteNavigator<Views>();
      const fakeMonadSetter = new FakeMonadSetter<RouteNavigator<Views>>(fakeRouteNavigator);

      const updates = item.onElementClicked_(assetId, projectId, fakeMonadSetter);
      assert(fakeMonadSetter.findValue(updates)!.value.getDestination()!).to.matchObject({
        params: {assetId, projectId},
        type: Views.ASSET_MAIN,
      });
    });

    it('should not navigate if there are no asset IDs', () => {
      const projectId = 'projectId';

      const assetMainFactory = Mocks.object('assetMainFactory');
      mockRouteFactoryService.assetMain.and.returnValue(assetMainFactory);

      const fakeRouteNavigator = new FakeRouteNavigator<Views>();
      const fakeMonadSetter = new FakeMonadSetter<RouteNavigator<Views>>(fakeRouteNavigator);

      assert(item.onElementClicked_(null, projectId, fakeMonadSetter)).to.equal([]);
    });

    it('should not navigate if there are no project IDs', () => {
      const assetId = 'assetId';

      const assetMainFactory = Mocks.object('assetMainFactory');
      mockRouteFactoryService.assetMain.and.returnValue(assetMainFactory);

      const fakeRouteNavigator = new FakeRouteNavigator<Views>();
      const fakeMonadSetter = new FakeMonadSetter<RouteNavigator<Views>>(fakeRouteNavigator);

      assert(item.onElementClicked_(assetId, null, fakeMonadSetter)).to.equal([]);
    });
  });

  describe('onIdsChanged_', () => {
    it('should set the asset name correctly', async () => {
      const assetId = 'assetId';
      const name = 'name';
      const asset = Asset2.withId(assetId).setName(name);

      const fakeAssetNameSetter = new FakeMonadSetter<string | null>(null);
      const fakeAssetAccess = new FakeDataAccess<Asset2>(ImmutableMap.of([
        [assetId, asset],
      ]));

      const updates = await item.onIdsChanged_(assetId, fakeAssetNameSetter, fakeAssetAccess);
      assert(fakeAssetNameSetter.findValue(updates)!.value).to.equal(name);
    });

    it('should not set the name if the asset is not found', async () => {
      const assetId = 'assetId';
      const fakeAssetNameSetter = new FakeMonadSetter<string | null>(null);
      const fakeAssetAccess = new FakeDataAccess<Asset2>();

      const updates = await item.onIdsChanged_(assetId, fakeAssetNameSetter, fakeAssetAccess);
      assert([...updates]).to.equal([]);
    });

    it('should delete the name if the asset ID is null', async () => {
      const fakeAssetNameSetter = new FakeMonadSetter<string | null>(null);
      const fakeAssetAccess = new FakeDataAccess<Asset2>();

      const updates = await item.onIdsChanged_(null, fakeAssetNameSetter, fakeAssetAccess);
      assert(fakeAssetNameSetter.findValue(updates)!.value).to.beNull();
    });
  });
});
