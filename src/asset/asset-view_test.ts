import { assert, TestBase } from '../test-base';
TestBase.setup();

import { FakeMonadSetter } from 'external/gs_tools/src/event';
import { Mocks } from 'external/gs_tools/src/mock';
import { TestDispose } from 'external/gs_tools/src/testing';

import { FakeRouteNavigator, RouteNavigator } from 'external/gs_ui/src/routing';

import { AssetView } from '../asset/asset-view';
import { TestRouteFactoryService } from '../routing/test-route-factory-service';
import { Views } from '../routing/views';


describe('asset.AssetView', () => {
  let mockRouteService: any;
  let view: AssetView;

  beforeEach(() => {
    mockRouteService = jasmine.createSpyObj('RouteService', ['getParams', 'goTo', 'on']);
    view = new AssetView(
        TestRouteFactoryService,
        mockRouteService,
        Mocks.object('ThemeService'));
    TestDispose.add(view);
  });

  describe('onRouteChanged_', () => {
    it('should navigate to asset data if the destination was asset main', () => {
      const assetId = 'assetId';
      const projectId = 'projectId';

      const fakeRouteNavigator = new FakeRouteNavigator<Views>();
      spyOn(fakeRouteNavigator, 'getRoute').and.returnValue({
        params: {assetId, projectId},
        path: 'path',
        type: Views.ASSET_MAIN,
      });
      const fakeRouteSetter = new FakeMonadSetter<RouteNavigator<Views>>(fakeRouteNavigator);

      const changes = view.onRouteChanged_(fakeRouteSetter);
      assert(fakeRouteSetter.findValue(changes)!.value.getDestination()!).to.matchObject({
        params: {assetId, projectId},
        type: Views.ASSET_DATA,
      });
      assert(fakeRouteNavigator.getRoute).to
          .haveBeenCalledWith(TestRouteFactoryService.assetMain());
    });

    it('should do nothing if the destination was not asset main', () => {
      const fakeRouteNavigator = new FakeRouteNavigator<Views>();
      spyOn(fakeRouteNavigator, 'getRoute').and.returnValue(null);
      const fakeRouteSetter = new FakeMonadSetter<RouteNavigator<Views>>(fakeRouteNavigator);

      assert(view.onRouteChanged_(fakeRouteSetter)).to.equal([]);
    });
  });
});

