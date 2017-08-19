import { monadOut, on } from 'external/gs_tools/src/event';
import { ImmutableSet } from 'external/gs_tools/src/immutable';
import { inject } from 'external/gs_tools/src/inject';
import { MonadSetter, MonadValue } from 'external/gs_tools/src/interfaces';
import { customElement } from 'external/gs_tools/src/webc';

import { BaseThemedElement } from 'external/gs_ui/src/common';
import { RouteServiceEvents } from 'external/gs_ui/src/const';
import { RouteNavigator, RouteService } from 'external/gs_ui/src/routing';
import { ThemeService } from 'external/gs_ui/src/theming';

import { DataView } from '../asset/data-view';
import { HelperView } from '../asset/helper-view';
import { LayerView } from '../asset/layer-view';
import { NavBar } from '../asset/nav-bar';
import { RenderView } from '../asset/render-view';
import { SettingsView } from '../asset/settings-view';
import { RouteFactoryService } from '../routing/route-factory-service';
import { Views } from '../routing/views';


/**
 * Main view for the asset section.
 */
@customElement({
  dependencies: ImmutableSet.of(
    [DataView, HelperView, LayerView, NavBar, RenderView, SettingsView],
  ),
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
  @on((view: AssetView) => view.routeService_, RouteServiceEvents.CHANGED)
  onRouteChanged_(
      @monadOut((view: AssetView) => view.routeService_.monad())
          routeSetter: MonadSetter<RouteNavigator<Views>>): MonadValue<any>[] {
    const route = routeSetter.value.getRoute(this.routeFactoryService_.assetMain());
    if (route === null) {
      return [];
    }

    const params = route.params;
    return [
      routeSetter.set(routeSetter.value.goTo(
          this.routeFactoryService_.assetData(),
          {assetId: params.assetId, projectId: params.projectId})),
    ];
  }
}
