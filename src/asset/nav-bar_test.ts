import {assert, TestBase} from '../test-base';
TestBase.setup();

import {Mocks} from 'external/gs_tools/src/mock';
import {TestDispose} from 'external/gs_tools/src/testing';

import {RouteServiceEvents} from 'external/gs_ui/src/routing';

import {NavBar} from './nav-bar';


describe('asset.NavBar', () => {
  let mockRouteFactoryService;
  let mockRouteService;
  let navbar: NavBar;

  beforeEach(() => {
    mockRouteFactoryService = jasmine
        .createSpyObj('RouteFactoryService', ['assetData', 'assetSettings', 'helper', 'layer']);
    mockRouteService = jasmine.createSpyObj('RouteService', ['getParams', 'goTo', 'on']);
    navbar = new NavBar(
        mockRouteFactoryService,
        mockRouteService,
        jasmine.createSpyObj('ThemeService', ['applyTheme']));
    TestDispose.add(navbar);
  });

  describe('onRouteChanged_', () => {
    it('should set the selected tab to the correct tab ID', () => {
      const tabId1 = 'tabId1';
      const tabId2 = 'tabId2';
      const tabId3 = 'tabId3';
      const routeFactory1 = Mocks.object('routeFactory1');
      const routeFactory2 = Mocks.object('routeFactory2');
      const routeFactory3 = Mocks.object('routeFactory3');

      navbar['routeMap_'].set(tabId1, routeFactory1);
      navbar['routeMap_'].set(tabId2, routeFactory2);
      navbar['routeMap_'].set(tabId3, routeFactory3);

      mockRouteService.getParams.and.callFake((factory: any) => {
        return factory === routeFactory2 ? {} : null;
      });

      spyOn(navbar['selectedTabHook_'], 'set');

      navbar['onRouteChanged_']();

      assert(navbar['selectedTabHook_'].set).to.haveBeenCalledWith(tabId2);
    });

    it('should not set the selected tab if there are no corresponding tab IDs', () => {
      const tabId = 'tabId';
      const routeFactory = Mocks.object('routeFactory');

      navbar['routeMap_'].set(tabId, routeFactory);

      mockRouteService.getParams.and.returnValue(null);

      spyOn(navbar['selectedTabHook_'], 'set');

      navbar['onRouteChanged_']();

      assert(navbar['selectedTabHook_'].set).toNot.haveBeenCalled();
    });
  });

  describe('onButtonClick_', () => {
    it('should navigate to the correct view', () => {
      const tabId1 = 'tabId1';
      const tabId2 = 'tabId2';
      const tabId3 = 'tabId3';
      const routeFactory1 = Mocks.object('routeFactory1');
      const routeFactory2 = Mocks.object('routeFactory2');
      const routeFactory3 = Mocks.object('routeFactory3');

      const params = Mocks.object('param');
      mockRouteService.getParams.and.callFake((factory: any) => {
        return factory === routeFactory2 ? params : null;
      });

      const destinationTabId = 'destinationTabId';
      const destinationRouteFactory = Mocks.object('destinationRouteFactory');
      navbar['routeMap_'].set(tabId1, routeFactory1);
      navbar['routeMap_'].set(tabId2, routeFactory2);
      navbar['routeMap_'].set(tabId3, routeFactory3);
      navbar['routeMap_'].set(destinationTabId, destinationRouteFactory);

      navbar['onButtonClick_'](destinationTabId);

      assert(mockRouteService.goTo).to.haveBeenCalledWith(destinationRouteFactory, params);
    });

    it('should do nothing if the tab ID does not have a corresponding route factory', () => {
      const tabId = 'tabId';

      navbar['onButtonClick_'](tabId);

      assert(mockRouteService.goTo).toNot.haveBeenCalled();
    });
  });

  describe('onMouseEnter_', () => {
    it('should set the drawer to be expanded', () => {
      spyOn(navbar['drawerHook_'], 'set');
      navbar['onMouseEnter_']();
      assert(navbar['drawerHook_'].set).to.haveBeenCalledWith(true);
    });
  });

  describe('onMouseLeave_', () => {
    it('should set the drawer to be collapsed', () => {
      spyOn(navbar['drawerHook_'], 'set');
      navbar['onMouseLeave_']();
      assert(navbar['drawerHook_'].set).to.haveBeenCalledWith(false);
    });
  });

  describe('onCreated', () => {
    it('should initialize the routeMap_ correctly, listen to route changed event, and call '
        + 'onRouteChanged_',
        () => {
          const helperRouteFactory = Mocks.object('helperRouteFactory');
          mockRouteFactoryService.helper.and.returnValue(helperRouteFactory);
          const assetDataRouteFactory = Mocks.object('assetDataRouteFactory');
          mockRouteFactoryService.assetData.and.returnValue(assetDataRouteFactory);
          const layerRouteFactory = Mocks.object('layerRouteFactory');
          mockRouteFactoryService.layer.and.returnValue(layerRouteFactory);
          const settingsRouteFactory = Mocks.object('settingsRouteFactory');
          mockRouteFactoryService.assetSettings.and.returnValue(settingsRouteFactory);

          const mockDisposable = jasmine.createSpyObj('Disposable', ['dispose']);
          mockRouteService.on.and.returnValue(mockDisposable);

          spyOn(navbar, 'onRouteChanged_');
          spyOn(navbar, 'addDisposable').and.callThrough();

          navbar.onCreated(Mocks.object('element'));
          assert(navbar['onRouteChanged_']).to.haveBeenCalledWith();
          assert(navbar['addDisposable']).to.haveBeenCalledWith(mockDisposable);
          assert(mockRouteService.on).to.haveBeenCalledWith(
              RouteServiceEvents.CHANGED,
              navbar['onRouteChanged_'],
              navbar);
          assert(navbar['routeMap_']).to.haveEntries([
            ['data', assetDataRouteFactory],
            ['helper', helperRouteFactory],
            ['layer', layerRouteFactory],
            ['settings', settingsRouteFactory],
          ]);
        });
  });
});
