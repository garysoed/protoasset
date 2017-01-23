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
    mockRouteFactoryService = jasmine.createSpyObj('RouteFactoryService', ['assetData', 'helper']);
    mockRouteService = jasmine.createSpyObj('RouteService', ['getParams', 'goTo', 'on']);
    navbar = new NavBar(
        mockRouteFactoryService,
        mockRouteService,
        jasmine.createSpyObj('ThemeService', ['applyTheme']));
    TestDispose.add(navbar);
  });

  describe('onRouteChanged_', () => {
    it('should set the selected tab to the correct tab ID', () => {
      let tabId1 = 'tabId1';
      let tabId2 = 'tabId2';
      let tabId3 = 'tabId3';
      let routeFactory1 = Mocks.object('routeFactory1');
      let routeFactory2 = Mocks.object('routeFactory2');
      let routeFactory3 = Mocks.object('routeFactory3');

      navbar['routeMap_'].set(tabId1, routeFactory1);
      navbar['routeMap_'].set(tabId2, routeFactory2);
      navbar['routeMap_'].set(tabId3, routeFactory3);

      mockRouteService.getParams.and.callFake((factory: any) => {
        return factory === routeFactory2 ? {} : null;
      });

      spyOn(navbar['selectedTabBridge_'], 'set');

      navbar['onRouteChanged_']();

      assert(navbar['selectedTabBridge_'].set).to.haveBeenCalledWith(tabId2);
    });

    it('should not set the selected tab if there are no corresponding tab IDs', () => {
      let tabId = 'tabId';
      let routeFactory = Mocks.object('routeFactory');

      navbar['routeMap_'].set(tabId, routeFactory);

      mockRouteService.getParams.and.returnValue(null);

      spyOn(navbar['selectedTabBridge_'], 'set');

      navbar['onRouteChanged_']();

      assert(navbar['selectedTabBridge_'].set).toNot.haveBeenCalled();
    });
  });

  describe('onButtonClick_', () => {
    it('should navigate to the correct view', () => {
      let tabId1 = 'tabId1';
      let tabId2 = 'tabId2';
      let tabId3 = 'tabId3';
      let routeFactory1 = Mocks.object('routeFactory1');
      let routeFactory2 = Mocks.object('routeFactory2');
      let routeFactory3 = Mocks.object('routeFactory3');

      let params = Mocks.object('param');
      mockRouteService.getParams.and.callFake((factory: any) => {
        return factory === routeFactory2 ? params : null;
      });

      let destinationTabId = 'destinationTabId';
      let destinationRouteFactory = Mocks.object('destinationRouteFactory');
      navbar['routeMap_'].set(tabId1, routeFactory1);
      navbar['routeMap_'].set(tabId2, routeFactory2);
      navbar['routeMap_'].set(tabId3, routeFactory3);
      navbar['routeMap_'].set(destinationTabId, destinationRouteFactory);

      navbar['onButtonClick_'](destinationTabId);

      assert(mockRouteService.goTo).to.haveBeenCalledWith(destinationRouteFactory, params);
    });

    it('should do nothing if the tab ID does not have a corresponding route factory', () => {
      let tabId = 'tabId';

      navbar['onButtonClick_'](tabId);

      assert(mockRouteService.goTo).toNot.haveBeenCalled();
    });
  });

  describe('onDataButtonClick_', () => {
    it('should call onButtonClick_ with the correct tab ID', () => {
      spyOn(navbar, 'onButtonClick_');
      navbar['onDataButtonClick_']();
      assert(navbar['onButtonClick_']).to.haveBeenCalledWith('data');
    });
  });

  describe('onHelperButtonClick_', () => {
    it('should call onButtonClick_ with the correct tab ID', () => {
      spyOn(navbar, 'onButtonClick_');
      navbar['onHelperButtonClick_']();
      assert(navbar['onButtonClick_']).to.haveBeenCalledWith('helper');
    });
  });

  describe('onLayerButtonClick_', () => {
    it('should call onButtonClick_ with the correct tab ID', () => {
      spyOn(navbar, 'onButtonClick_');
      navbar['onLayerButtonClick_']();
      assert(navbar['onButtonClick_']).to.haveBeenCalledWith('layer');
    });
  });

  describe('onMouseEnter_', () => {
    it('should set the drawer to be expanded', () => {
      spyOn(navbar['drawerBridge_'], 'set');
      navbar['onMouseEnter_']();
      assert(navbar['drawerBridge_'].set).to.haveBeenCalledWith(true);
    });
  });

  describe('onMouseLeave_', () => {
    it('should set the drawer to be collapsed', () => {
      spyOn(navbar['drawerBridge_'], 'set');
      navbar['onMouseLeave_']();
      assert(navbar['drawerBridge_'].set).to.haveBeenCalledWith(false);
    });
  });

  describe('onRenderButtonClick_', () => {
    it('should call onButtonClick_ with the correct tab ID', () => {
      spyOn(navbar, 'onButtonClick_');
      navbar['onRenderButtonClick_']();
      assert(navbar['onButtonClick_']).to.haveBeenCalledWith('render');
    });
  });

  describe('onCreated', () => {
    it('should initialize the routeMap_ correctly, listen to route changed event, and call '
        + 'onRouteChanged_',
        () => {
          let helperRouteFactory = Mocks.object('helperRouteFactory');
          mockRouteFactoryService.helper.and.returnValue(helperRouteFactory);
          let assetDataRouteFactory = Mocks.object('assetDataRouteFactory');
          mockRouteFactoryService.assetData.and.returnValue(assetDataRouteFactory);

          let mockDisposable = jasmine.createSpyObj('Disposable', ['dispose']);
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
          ]);
        });
  });
});
