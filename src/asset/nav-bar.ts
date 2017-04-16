import { Maps } from 'external/gs_tools/src/collection';
import { DomEvent } from 'external/gs_tools/src/event';
import { inject } from 'external/gs_tools/src/inject';
import { BooleanParser, StringParser } from 'external/gs_tools/src/parse';
import {
  bind,
  customElement,
  DomHook,
  handle } from 'external/gs_tools/src/webc';

import { BaseThemedElement } from 'external/gs_ui/src/common';
import { AbstractRouteFactory, RouteService, RouteServiceEvents } from 'external/gs_ui/src/routing';
import { ThemeService } from 'external/gs_ui/src/theming';

import { RouteFactoryService } from '../routing/route-factory-service';
import { Views } from '../routing/views';


/**
 * NavBar
 */
@customElement({
  tag: 'pa-asset-nav-bar',
  templateKey: 'src/asset/nav-bar',
})
export class NavBar extends BaseThemedElement {
  @bind('#drawer').attribute('gs-is-expanded', BooleanParser)
  private readonly drawerHook_: DomHook<boolean>;

  @bind('#tab').attribute('gs-selected-tab', StringParser)
  private readonly selectedTabHook_: DomHook<string>;

  private readonly routeFactoryService_: RouteFactoryService;
  private readonly routeService_: RouteService<Views>;
  private readonly routeMap_: Map<string, AbstractRouteFactory<any, any, any, any>>;

  constructor(
      @inject('pa.routing.RouteFactoryService') routeFactoryService: RouteFactoryService,
      @inject('gs.routing.RouteService') routeService: RouteService<Views>,
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);
    this.drawerHook_ = DomHook.of<boolean>();
    this.routeFactoryService_ = routeFactoryService;
    this.routeMap_ = new Map<string, AbstractRouteFactory<any, any, any, any>>();
    this.routeService_ = routeService;
    this.selectedTabHook_ = DomHook.of<string>();
  }

  /**
   * Handles when the route is changed.
   */
  private onRouteChanged_(): void {
    let tabId = Maps
        .of(this.routeMap_)
        .findKey((factory: AbstractRouteFactory<any, any, any, any>) => {
          return this.routeService_.getParams(factory) !== null;
        });

    if (tabId !== null) {
      this.selectedTabHook_.set(tabId);
    }
  }

  /**
   * Handles when a nav button is clicked.
   * @param tabId Tab ID corresponding to the clicked button.
   */
  @handle('#data').event(DomEvent.CLICK, ['data'])
  @handle('#helper').event(DomEvent.CLICK, ['helper'])
  @handle('#layer').event(DomEvent.CLICK, ['layer'])
  @handle('#render').event(DomEvent.CLICK, ['render'])
  @handle('#settings').event(DomEvent.CLICK, ['settings'])
  protected onButtonClick_(tabId: string): void {
    let routeFactory = this.routeMap_.get(tabId);
    if (routeFactory === undefined) {
      return;
    }

    let currentParams = null;
    Maps
        .of(this.routeMap_)
        .forOf((
            factory: AbstractRouteFactory<any, any, any, any>,
            tabId: string,
            breakFn: () => void) => {
          let params = this.routeService_.getParams(factory);
          if (params !== null) {
            currentParams = params;
            breakFn();
          }
        });
    this.routeService_.goTo(routeFactory, currentParams);
  }

  @handle(null).event(DomEvent.MOUSEENTER)
  protected onMouseEnter_(): void {
    this.drawerHook_.set(true);
  }

  @handle(null).event(DomEvent.MOUSELEAVE)
  protected onMouseLeave_(): void {
    this.drawerHook_.set(false);
  }

  /**
   * @override
   */
  onCreated(element: HTMLElement): void {
    super.onCreated(element);
    this.routeMap_.set('data', this.routeFactoryService_.assetData());
    this.routeMap_.set('helper', this.routeFactoryService_.helper());
    this.routeMap_.set('layer', this.routeFactoryService_.layer());
    this.routeMap_.set('settings', this.routeFactoryService_.assetSettings());
    this.routeMap_.set('render', this.routeFactoryService_.render());

    this.listenTo(
        this.routeService_,
        RouteServiceEvents.CHANGED,
        this.onRouteChanged_);
    this.onRouteChanged_();
  }
}
