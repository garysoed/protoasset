import {AbstractRouteFactory} from 'external/gs_ui/src/routing';

import {Project} from '../data/project';
import {ProjectCollection} from '../data/project-collection';
import {Views} from './views';


type CP = {projectId: string};
type PR = {};
type CR = CP & PR;


export class AssetListRouteFactory extends AbstractRouteFactory<Views, CP, CR, PR> {
  private readonly projectCollection_: ProjectCollection;

  constructor(
      projectCollection: ProjectCollection,
      parent: AbstractRouteFactory<Views, any, PR, any>) {
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
  protected getRelativePath_(params: CP): string {
    return `/project/${params.projectId}`;
  }

  /**
   * @override
   */
  getRelativeMatchParams_(matches: {[key: string]: string}): CP {
    return {
      projectId: matches['projectId'],
    };
  }

  /**
   * @override
   */
  getName(params: CR): Promise<string> {
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
