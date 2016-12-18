import {IRouteFactory} from './interfaces';
import {Route} from './route';


export class CreateAssetRouteFactory implements IRouteFactory<string, {projectId: string}> {
  /**
   * Creates a new Route object.
   *
   * @override
   */
  create(projectId: string): Route {
    return new Route(`/project/${projectId}/create`);
  }

  /**
   * @override
   */
  getMatcher(): string {
    return `/project/:projectId/create$`;
  }

  /**
   * @override
   */
  populateMatches(matches: {[key: string]: string}): {projectId: string} {
    return {
      projectId: matches['projectId'],
    };
  }
}
