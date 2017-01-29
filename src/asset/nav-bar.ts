import {Maps} from 'external/gs_tools/src/collection';
import {DomEvent} from 'external/gs_tools/src/event';
import {inject} from 'external/gs_tools/src/inject';
import {
  bind,
  BooleanParser,
  customElement,
  DomBridge,
  handle,
  StringParser} from 'external/gs_tools/src/webc';

import {BaseThemedElement} from 'external/gs_ui/src/common';
import {AbstractRouteFactory, RouteService, RouteServiceEvents} from 'external/gs_ui/src/routing';
import {ThemeService} from 'external/gs_ui/src/theming';

import {RouteFactoryService} from '../routing/route-factory-service';
import {Views} from '../routing/views';


/**
 * NavBar
 */
@customElement({
  tag: 'pa-asset-nav-bar',
  templateKey: 'src/asset/nav-bar',
})
export class NavBar extends BaseThemedElement {
  @bind('#drawer').attribute('gs-is-expanded', BooleanParser)
  private readonly drawerBridge_: DomBridge<boolean>;

  @bind('#tab').attribute('gs-selected-tab', StringParser)
  private readonly selectedTabBridge_: DomBridge<string>;

  private readonly routeFactoryService_: RouteFactoryService;
  private readonly routeService_: RouteService<Views>;
  private readonly routeMap_: Map<string, AbstractRouteFactory<any, any, any, any>>;

  constructor(
      @inject('pa.routing.RouteFactoryService') routeFactoryService: RouteFactoryService,
      @inject('gs.routing.RouteService') routeService: RouteService<Views>,
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);
    this.drawerBridge_ = DomBridge.of<boolean>();
    this.routeFactoryService_ = routeFactoryService;
    this.routeMap_ = new Map<string, AbstractRouteFactory<any, any, any, any>>();
    this.routeService_ = routeService;
    this.selectedTabBridge_ = DomBridge.of<string>();
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
      this.selectedTabBridge_.set(tabId);
    }
  }

  /**
   * Handles when a nav button is clicked.
   * @param tabId Tab ID corresponding to the clicked button.
   */
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

  @handle('#data').event(DomEvent.CLICK)
  protected onDataButtonClick_(): void {
    this.onButtonClick_('data');
  }

  @handle('#helper').event(DomEvent.CLICK)
  protected onHelperButtonClick_(): void {
    this.onButtonClick_('helper');
  }

  @handle('#layer').event(DomEvent.CLICK)
  protected onLayerButtonClick_(): void {
    this.onButtonClick_('layer');
  }

  @handle(null).event(DomEvent.MOUSEENTER)
  protected onMouseEnter_(): void {
    this.drawerBridge_.set(true);
  }

  @handle(null).event(DomEvent.MOUSELEAVE)
  protected onMouseLeave_(): void {
    this.drawerBridge_.set(false);
  }

  @handle('#render').event(DomEvent.CLICK)
  protected onRenderButtonClick_(): void {
    this.onButtonClick_('render');
  }

  /**
   * @override
   */
  onCreated(element: HTMLElement): void {
    super.onCreated(element);
    this.routeMap_.set('data', this.routeFactoryService_.assetData());
    this.routeMap_.set('helper', this.routeFactoryService_.helper());
    this.routeMap_.set('layer', this.routeFactoryService_.layer());

    this.addDisposable(this.routeService_.on(
        RouteServiceEvents.CHANGED,
        this.onRouteChanged_,
        this));
    this.onRouteChanged_();
  }
}
