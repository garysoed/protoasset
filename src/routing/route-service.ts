import {BaseListenable} from 'external/gs_tools/src/event';
import {bind, inject} from 'external/gs_tools/src/inject';
import {LocationService, LocationServiceEvents} from 'external/gs_tools/src/ui';
import {Reflect} from 'external/gs_tools/src/util';

import {IRouteFactory} from './interfaces';
import {Route} from './route';
import {RouteServiceEvents} from './route-service-events';


@bind(
    'pa.routing.RouteService',
    [
      LocationService,
    ])
export class RouteService extends BaseListenable<RouteServiceEvents> {
  private readonly locationService_: LocationService;

  constructor(
      @inject('gs.LocationService') locationService: LocationService) {
    super();
    this.locationService_ = locationService;
  }

  /**
   * Handles event when the location has changed.
   */
  private onLocationChanged_(): void {
    this.dispatch(RouteServiceEvents.CHANGED);
  }

  /**
   * Called during initialization.
   */
  [Reflect.__initialize](): void {
    this.addDisposable(this.locationService_.on(
        LocationServiceEvents.CHANGED,
        this.onLocationChanged_,
        this));
  }

  /**
   * Go to the given route object.
   */
  goTo(route: Route): void {
    this.locationService_.goTo(route.getLocation());
  }

  /**
   * @return True iff the current location is displaying the given route.
   */
  isDisplayed(routeFactory: IRouteFactory<any>): boolean {
    return this.locationService_.hasMatch(routeFactory.getMatcher());
  }
}
