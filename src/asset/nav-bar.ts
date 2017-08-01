import { eventDetails, on } from 'external/gs_tools/src/event';
import { ImmutableMap, ImmutableSet } from 'external/gs_tools/src/immutable';
import { inject } from 'external/gs_tools/src/inject';
import { MonadSetter, MonadValue } from 'external/gs_tools/src/interfaces';
import { BooleanParser, StringParser } from 'external/gs_tools/src/parse';
import { customElement, domOut, onDom, onLifecycle} from 'external/gs_tools/src/webc';

import { BaseThemedElement2 } from 'external/gs_ui/src/common';
import { RouteServiceEvents } from 'external/gs_ui/src/const';
import { AbstractRouteFactory, RouteService } from 'external/gs_ui/src/routing';
import { ThemeService } from 'external/gs_ui/src/theming';

import { RouteFactoryService } from '../routing/route-factory-service';
import { Views } from '../routing/views';

const DATA_EL = '#data';
const DRAWER_EL = '#drawer';
const HELPER_EL = '#helper';
const LAYER_EL = '#layer';
const RENDER_EL = '#render';
const SETTINGS_EL = '#settings';
const TAB_EL = '#tab';

const DRAWER_EXPANDED_ATTR = {name: 'expanded', parser: BooleanParser, selector: DRAWER_EL};
const SELECTED_TAB_ATTR = {name: 'selected-tab', parser: StringParser, selector: TAB_EL};

/**
 * NavBar
 */
@customElement({
  tag: 'pa-asset-nav-bar',
  templateKey: 'src/asset/nav-bar',
})
export class NavBar extends BaseThemedElement2 {
  private readonly routeFactoryService_: RouteFactoryService;
  private readonly routeMap_: ImmutableMap<string, AbstractRouteFactory<any, any, any, any>>;
  private readonly routeService_: RouteService<Views>;

  constructor(
      @inject('pa.routing.RouteFactoryService') routeFactoryService: RouteFactoryService,
      @inject('gs.routing.RouteService') routeService: RouteService<Views>,
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);
    this.routeFactoryService_ = routeFactoryService;
    this.routeMap_ = ImmutableMap.of<string, AbstractRouteFactory<any, any, any, any>>([
      ['data', this.routeFactoryService_.assetData()],
      ['helper', this.routeFactoryService_.helper()],
      ['layer', this.routeFactoryService_.layer()],
      ['settings', this.routeFactoryService_.assetSettings()],
      ['render', this.routeFactoryService_.render()],
    ]);
    this.routeService_ = routeService;
  }

  /**
   * Handles when a nav button is clicked.
   * @param tabId Tab ID corresponding to the clicked button.
   */
  @onDom.event(DATA_EL, 'gs-action')
  @onDom.event(HELPER_EL, 'gs-action')
  @onDom.event(LAYER_EL, 'gs-action')
  @onDom.event(RENDER_EL, 'gs-action')
  @onDom.event(SETTINGS_EL, 'gs-action')
  onButtonClick_(@eventDetails() event: Event): void {
    const eventTarget = event.target;
    if (!(eventTarget instanceof Element)) {
      return;
    }

    const tabId = eventTarget.getAttribute('tab-id');
    if (tabId === null) {
      return;
    }

    const routeFactory = this.routeMap_.get(tabId);
    if (!routeFactory) {
      return;
    }

    let currentParams = null;
    for (const [, factory] of this.routeMap_) {
      const params = this.routeService_.getParams(factory);
      if (params) {
        currentParams = params;
        break;
      }
    }
    this.routeService_.goTo(routeFactory, currentParams);
  }

  @onDom.event(null, 'mouseenter')
  onMouseEnter_(
      @domOut.attribute(DRAWER_EXPANDED_ATTR) drawerExpandedSetter: MonadSetter<boolean | null>):
      Iterable<MonadValue<any>> {
    return ImmutableSet.of([drawerExpandedSetter.set(true)]);
  }

  @onDom.event(null, 'mouseleave')
  onMouseLeave_(
      @domOut.attribute(DRAWER_EXPANDED_ATTR) drawerExpandedSetter: MonadSetter<boolean | null>):
      Iterable<MonadValue<any>> {
    return ImmutableSet.of([drawerExpandedSetter.set(false)]);
  }

  /**
   * Handles when the route is changed.
   */
  @on((bar: NavBar) => bar.routeService_, RouteServiceEvents.CHANGED)
  @onLifecycle('create')
  onRouteChanged_(
      @domOut.attribute(SELECTED_TAB_ATTR) selectedTabSetter: MonadSetter<string | null>):
      Iterable<MonadValue<any>> {
    const tabId = ImmutableMap
        .of(this.routeMap_)
        .findKey((factory: AbstractRouteFactory<any, any, any, any>) => {
          return this.routeService_.getParams(factory) !== null;
        });

    if (tabId !== null) {
      return ImmutableSet.of([selectedTabSetter.set(tabId)]);
    } else {
      return ImmutableSet.of([]);
    }
  }
}
