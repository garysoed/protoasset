import {IRouteFactory, Route} from 'external/gs_ui/src/routing';


export class ProjectRouteFactory implements IRouteFactory<string, {projectId: string}> {
  /**
   * Creates a new Route object.
   *
   * @override
   */
  create(projectId: string): Route {
    return new Route(`/project/${projectId}`);
  }

  /**
   * @override
   */
  getMatcher(): string {
    return `/project/:projectId$`;
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
