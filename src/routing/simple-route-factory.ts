import {IRouteFactory} from './interfaces';
import {Route} from './route';


export class SimpleRouteFactory implements IRouteFactory<void, void> {
  private readonly location_: string;

  constructor(location: string) {
    this.location_ = location;
  }

  /**
   * Creates a new Route object.
   *
   * @return A new instance of the route.
   */
  create(): Route {
    return new Route(this.location_);
  }

  /**
   * @return The matcher string to query the location service.
   */
  getMatcher(): string {
    return `${this.location_}$`;
  }

  /**
   * @override
   */
  populateMatches(matches: {[key: string]: string}): void { }
}
