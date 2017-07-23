import { assert, TestBase } from '../test-base';
TestBase.setup();

import { Mocks } from 'external/gs_tools/src/mock';
import { TestDispose } from 'external/gs_tools/src/testing';
import { Reflect } from 'external/gs_tools/src/util';

import { RouteServiceEvents } from 'external/gs_ui/src/const';

import { AssetView } from './asset-view';


describe('asset.AssetView', () => {
  let mockRouteFactoryService: any;
  let mockRouteService: any;
  let view: AssetView;

  beforeEach(() => {
    mockRouteFactoryService =
        jasmine.createSpyObj('RouteFactoryService', ['assetData', 'assetMain']);
    mockRouteService = jasmine.createSpyObj('RouteService', ['getParams', 'goTo', 'on']);
    view = new AssetView(
        mockRouteFactoryService,
        mockRouteService,
        Mocks.object('ThemeService'));
    TestDispose.add(view);
  });

  describe('onRouteChanged_', () => {
    it('should navigate to asset data if the destination was asset main', () => {
      const assetMain = Mocks.object('assetMain');
      mockRouteFactoryService.assetMain.and.returnValue(assetMain);

      const assetData = Mocks.object('assetData');
      mockRouteFactoryService.assetData.and.returnValue(assetData);

      const assetId = 'assetId';
      const projectId = 'projectId';
      mockRouteService.getParams.and.returnValue({assetId, projectId});

      view['onRouteChanged_']();

      assert(mockRouteService.goTo).to.haveBeenCalledWith(assetData, {assetId, projectId});
      assert(mockRouteService.getParams).to.haveBeenCalledWith(assetMain);
    });

    it('should do nothing if the destination was not asset main', () => {
      mockRouteFactoryService.assetMain.and.returnValue(Mocks.object('assetMain'));

      mockRouteService.getParams.and.returnValue(null);

      view['onRouteChanged_']();

      assert(mockRouteService.goTo).toNot.haveBeenCalled();
    });
  });

  describe('[Reflect.__initialize]', () => {
    it('should listen to route changed event', () => {
      spyOn(view, 'listenTo');
      spyOn(view, 'addDisposable').and.callThrough();
      const mockDisposable = jasmine.createSpyObj('Disposable', ['dispose']);
      mockRouteService.on.and.returnValue(mockDisposable);

      view[Reflect.__initialize](view);

      assert(view.addDisposable).to.haveBeenCalledWith(mockDisposable);
      assert(mockRouteService.on).to.haveBeenCalledWith(
          RouteServiceEvents.CHANGED, view['onRouteChanged_'], view);
    });
  });
});

