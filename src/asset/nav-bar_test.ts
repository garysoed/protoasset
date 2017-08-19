import { assert, Fakes, TestBase } from '../test-base';
TestBase.setup();

import { Mocks } from 'external/gs_tools/src/mock';
import { TestDispose } from 'external/gs_tools/src/testing';

import { FakeMonadSetter } from 'external/gs_tools/src/event';
import { FakeRouteNavigator, Route, RouteNavigator } from 'external/gs_ui/src/routing';

import { NavBar } from '../asset/nav-bar';
import { TestRouteFactoryService } from '../routing/test-route-factory-service';
import { Views } from '../routing/views';

describe('asset.NavBar', () => {
  let mockRouteService: any;
  let navbar: NavBar;

  beforeEach(() => {
    mockRouteService = jasmine.createSpyObj('RouteService', ['getParams', 'goTo', 'on']);
    navbar = new NavBar(
        TestRouteFactoryService,
        mockRouteService,
        jasmine.createSpyObj('ThemeService', ['applyTheme']));
    TestDispose.add(navbar);
  });

  describe('onButtonClick_', () => {
    it('should navigate to the correct view', () => {
      const destinationTabId = 'helper';
      const params = Mocks.object('params');

      const target = document.createElement('div');
      target.setAttribute('tab-id', destinationTabId);
      const fakeRouteNavigator = new FakeRouteNavigator<Views>([
        [/.*/, {params, path: '', type: Views.ASSET_MAIN}] as [RegExp, Route<Views, any>],
      ]);
      const fakeRouteSetter = new FakeMonadSetter<RouteNavigator<Views>>(fakeRouteNavigator);

      const updates = navbar.onButtonClick_({target} as any, fakeRouteSetter);
      assert(fakeRouteSetter.findValue(updates)!.value.getDestination()).to.matchObject({
        params,
        type: Views.HELPER,
      });
    });

    it(`should do nothing if the current URL has no match`, () => {
      const destinationTabId = 'helper';

      const target = document.createElement('div');
      target.setAttribute('tab-id', destinationTabId);
      const fakeRouteNavigator = new FakeRouteNavigator<Views>();
      const fakeRouteSetter = new FakeMonadSetter<RouteNavigator<Views>>(fakeRouteNavigator);

      assert(navbar.onButtonClick_({target} as any, fakeRouteSetter)).to.equal([]);
    });

    it('should do nothing if the tab ID does not have a corresponding route factory', () => {
      const target = document.createElement('div');
      target.setAttribute('tab-id', 'unknownTabId');
      const fakeRouteNavigator = new FakeRouteNavigator<Views>();
      const fakeRouteSetter = new FakeMonadSetter<RouteNavigator<Views>>(fakeRouteNavigator);

      assert(navbar.onButtonClick_({target} as any, fakeRouteSetter)).to.equal([]);
    });

    it(`should do nothing if there are no tab IDs`, () => {
      const target = document.createElement('div');
      const fakeRouteNavigator = new FakeRouteNavigator<Views>();
      const fakeRouteSetter = new FakeMonadSetter<RouteNavigator<Views>>(fakeRouteNavigator);

      assert(navbar.onButtonClick_({target} as any, fakeRouteSetter)).to.equal([]);
    });

    it(`should do nothing if the target is not an Element`, () => {
      const target = Mocks.object('target');
      const fakeRouteNavigator = new FakeRouteNavigator<Views>();
      const fakeRouteSetter = new FakeMonadSetter<RouteNavigator<Views>>(fakeRouteNavigator);

      assert(navbar.onButtonClick_({target} as any, fakeRouteSetter)).to.equal([]);
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
      const fakeSelectedTabSetter = new FakeMonadSetter<string | null>(null);
      const fakeRouteNavigator = new FakeRouteNavigator<Views>();
      Fakes.build(spyOn(fakeRouteNavigator, 'getRoute'))
          .when(TestRouteFactoryService.helper()).return(Mocks.object('params'))
          .else().return(null);

      const updates = navbar.onRouteChanged_(fakeSelectedTabSetter, fakeRouteNavigator);
      assert(fakeSelectedTabSetter.findValue(updates)!.value).to.equal('helper');
    });

    it('should not set the selected tab if there are no corresponding tab IDs', () => {
      const fakeRouteNavigator = new FakeRouteNavigator<Views>();
      spyOn(fakeRouteNavigator, 'getRoute').and.returnValue(null);
      const fakeSelectedTabSetter = new FakeMonadSetter<string | null>(null);

      assert(navbar.onRouteChanged_(fakeSelectedTabSetter, fakeRouteNavigator)).to.equal([]);
    });
  });
});
