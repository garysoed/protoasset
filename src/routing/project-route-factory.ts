import {AbstractRouteFactory} from 'external/gs_ui/src/routing';

import {Project} from '../data/project';
import {ProjectCollection} from '../data/project-collection';
import {Views} from './views';


type Params = {projectId: string};


export class ProjectRouteFactory extends AbstractRouteFactory<Views, {}, Params> {
  private readonly projectCollection_: ProjectCollection;

  constructor(
      projectCollection: ProjectCollection,
      parent: AbstractRouteFactory<Views, any, {}>) {
    super(Views.PROJECT, parent);
    this.projectCollection_ = projectCollection;
  }

  /**
   * @override
   */
  protected getRelativeMatcher_(): string {
    return `/project/:projectId`;
  }

  /**
   * @override
   */
  protected getRelativePath_(params: Params): string {
    return `/project/${params.projectId}`;
  }

  /**
   * @override
   */
  getRelativeMatchParams_(matches: {[key: string]: string}): Params {
    return {
      projectId: matches['projectId'],
    };
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
  getName(params: Params): Promise<string> {
    return this.projectCollection_
        .get(params.projectId)
        .then((project: Project | null) => {
          if (project === null) {
            return `Unknown project ${params.projectId}`;
          }

          return project.getName();
        });
  }
}
