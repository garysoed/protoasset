import {ProjectRouteFactory} from './project-route-factory';
import {SimpleRouteFactory} from './simple-route-factory';


/**
 * Routes available in the app.
 */
export const Routes = {
  CREATE_PROJECT: new SimpleRouteFactory('/create'),
  LANDING: new SimpleRouteFactory('/'),
  PROJECT: new ProjectRouteFactory(),
};
