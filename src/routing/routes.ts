import {SimpleRouteFactory} from 'external/gs_ui/src/routing';

import {CreateAssetRouteFactory} from './create-asset-route-factory';
import {ProjectRouteFactory} from './project-route-factory';


/**
 * Routes available in the app.
 */
export const Routes = {
  CREATE_ASSET: new CreateAssetRouteFactory(),
  CREATE_PROJECT: new SimpleRouteFactory('/create'),
  LANDING: new SimpleRouteFactory('/'),
  PROJECT: new ProjectRouteFactory(),
};
