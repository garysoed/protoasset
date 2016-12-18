import {CreateAssetRouteFactory} from './create-asset-route-factory';
import {ProjectRouteFactory} from './project-route-factory';
import {SimpleRouteFactory} from './simple-route-factory';


/**
 * Routes available in the app.
 */
export const Routes = {
  CREATE_ASSET: new CreateAssetRouteFactory(),
  CREATE_PROJECT: new SimpleRouteFactory('/create'),
  LANDING: new SimpleRouteFactory('/'),
  PROJECT: new ProjectRouteFactory(),
};
