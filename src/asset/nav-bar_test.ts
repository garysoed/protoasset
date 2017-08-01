import { assert, Fakes, TestBase } from '../test-base';
TestBase.setup();

import { ImmutableMap } from 'external/gs_tools/src/immutable';
import { Mocks } from 'external/gs_tools/src/mock';
import { TestDispose } from 'external/gs_tools/src/testing';

import { FakeMonadSetter } from 'external/gs_tools/src/event';
import { NavBar } from './nav-bar';

describe('asset.NavBar', () => {
  let mockRouteFactoryService: any;
  let mockRouteService: any;
  let navbar: NavBar;

  beforeEach(() => {
    mockRouteFactoryService = jasmine.createSpyObj(
        'RouteFactoryService',
        ['assetData', 'assetSettings', 'helper', 'layer', 'render']);
    mockRouteService = jasmine.createSpyObj('RouteService', ['getParams', 'goTo', 'on']);
    navbar = new NavBar(
        mockRouteFactoryService,
        mockRouteService,
        jasmine.createSpyObj('ThemeService', ['applyTheme']));
    TestDispose.add(navbar);
  });

  describe('onButtonClick_', () => {
    it('should navigate to the correct view', () => {
      const tabId1 = 'tabId1';
      const tabId2 = 'tabId2';
      const tabId3 = 'tabId3';
      const routeFactory1 = Mocks.object('routeFactory1');
      const routeFactory2 = Mocks.object('routeFactory2');
      const routeFactory3 = Mocks.object('routeFactory3');

      const destinationTabId = 'destinationTabId';
      const destinationRouteFactory = Mocks.object('destinationRouteFactory');
      Fakes.build(spyOn(navbar['routeMap_'], 'get'))
          .when(tabId1).return(routeFactory1)
          .when(tabId2).return(routeFactory2)
          .when(tabId3).return(routeFactory3)
          .when(destinationTabId).return(destinationRouteFactory);

      const map = ImmutableMap.of([
        [tabId1, routeFactory1],
        [tabId2, routeFactory2],
        [tabId3, routeFactory3],
        [destinationTabId, destinationRouteFactory],
      ]);
      spyOn(navbar['routeMap_'], Symbol.iterator).and.returnValue(map[Symbol.iterator]());

      const params = Mocks.object('param');
      mockRouteService.getParams.and.callFake((factory: any) => {
        return factory === destinationRouteFactory ? params : null;
      });

      const target = document.createElement('div');
      target.setAttribute('tab-id', destinationTabId);

      navbar.onButtonClick_({target} as any);

      assert(mockRouteService.goTo).to.haveBeenCalledWith(destinationRouteFactory, params);
    });

    it('should do nothing if the tab ID does not have a corresponding route factory', () => {
      const tabId = 'tabId';
      spyOn(navbar['routeMap_'], 'get').and.returnValue(null);

      const target = document.createElement('div');
      target.setAttribute('tab-id', tabId);

      navbar.onButtonClick_({target} as any);

      assert(mockRouteService.goTo).toNot.haveBeenCalled();
    });

    it(`should do nothing if there are no tab IDs`, () => {
      const target = document.createElement('div');

      navbar.onButtonClick_({target} as any);

      assert(mockRouteService.goTo).toNot.haveBeenCalled();
    });

    it(`should do nothing if the target is not an Element`, () => {
      const target = Mocks.object('target');

      navbar.onButtonClick_({target} as any);

      assert(mockRouteService.goTo).toNot.haveBeenCalled();
    });
  });

  describe('onMouseEnter_', () => {
    it('should set the drawer to be expanded', () => {
      const fakeDrawerExpandedSetter = new FakeMonadSetter<boolean | null>(null);

      const updates = navbar.onMouseEnter_(fakeDrawerExpandedSetter);
      assert(fakeDrawerExpandedSetter.findValue(updates)!.value).to.beTrue();
    });
  });

  describe('onMouseLeave_', () => {
    it('should set the drawer to be collapsed', () => {
      const fakeDrawerExpandedSetter = new FakeMonadSetter<boolean | null>(null);

      const updates = navbar.onMouseLeave_(fakeDrawerExpandedSetter);
      assert(fakeDrawerExpandedSetter.findValue(updates)!.value).to.beFalse();
    });
  });

  describe('onRouteChanged_', () => {
    it('should set the selected tab to the correct tab ID', () => {
      const tabId1 = 'tabId1';
      const tabId2 = 'tabId2';
      const tabId3 = 'tabId3';
      const routeFactory1 = Mocks.object('routeFactory1');
      const routeFactory2 = Mocks.object('routeFactory2');
      const routeFactory3 = Mocks.object('routeFactory3');

      const map = ImmutableMap.of([
        [tabId1, routeFactory1],
        [tabId2, routeFactory2],
        [tabId3, routeFactory3],
      ]);
      spyOn(navbar['routeMap_'], Symbol.iterator).and.returnValue(map[Symbol.iterator]());

      mockRouteService.getParams.and.callFake((factory: any) => {
        return factory === routeFactory2 ? {} : null;
      });

      const fakeSelectedTabSetter = new FakeMonadSetter<string | null>(null);

      const updates = navbar.onRouteChanged_(fakeSelectedTabSetter);

      assert(fakeSelectedTabSetter.findValue(updates)!.value).to.equal(tabId2);
    });

    it('should not set the selected tab if there are no corresponding tab IDs', () => {
      const tabId = 'tabId';
      const routeFactory = Mocks.object('routeFactory');

      const map = ImmutableMap.of([
        [tabId, routeFactory],
      ]);
      spyOn(navbar['routeMap_'], Symbol.iterator).and.returnValue(map[Symbol.iterator]());

      mockRouteService.getParams.and.returnValue(null);

      const fakeSelectedTabSetter = new FakeMonadSetter<string | null>(null);

      const updates = navbar.onRouteChanged_(fakeSelectedTabSetter);
      assert([...updates]).to.equal([]);
    });
  });
});
