import {inject} from 'external/gs_tools/src/inject';
import {Reflect} from 'external/gs_tools/src/util';
import {customElement} from 'external/gs_tools/src/webc';

import {BaseThemedElement} from 'external/gs_ui/src/common';
import {RouteService, RouteServiceEvents} from 'external/gs_ui/src/routing';
import {ThemeService} from 'external/gs_ui/src/theming';

import {RouteFactoryService} from '../routing/route-factory-service';
import {Views} from '../routing/views';

import {DataView} from './data-view';
import {HelperListView} from './helper-list-view';
import {HelperView} from './helper-view';
import {NavBar} from './nav-bar';


/**
 * Main view for the asset section.
 */
@customElement({
  dependencies: [DataView, HelperListView, HelperView, NavBar],
  tag: 'pa-asset-view',
  templateKey: 'src/asset/asset-view',
})
export class AssetView extends BaseThemedElement {
  private readonly routeFactoryService_: RouteFactoryService;
  private readonly routeService_: RouteService<Views>;

  constructor(
      @inject('pa.routing.RouteFactoryService') routeFactoryService: RouteFactoryService,
      @inject('gs.routing.RouteService') routeService: RouteService<Views>,
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);
    this.routeFactoryService_ = routeFactoryService;
    this.routeService_ = routeService;
  }

  /**
   * Handles when the route was changed.
   */
  private onRouteChanged_(): void {
    let params = this.routeService_.getParams(this.routeFactoryService_.assetMain());
    if (params === null) {
      return;
    }

    this.routeService_.goTo(
        this.routeFactoryService_.assetData(),
        {assetId: params.assetId, projectId: params.projectId});
  }

  /**
   * @override
   */
  [Reflect.__initialize](): void {
    this.routeService_.on(RouteServiceEvents.CHANGED, this.onRouteChanged_, this);
  }
}
