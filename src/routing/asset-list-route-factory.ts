import { AbstractRouteFactory } from 'external/gs_ui/src/routing';

import { ProjectCollection } from '../data/project-collection';
import { Views } from './views';


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
  async getName(params: CR): Promise<string> {
    const project = await this.projectCollection_.get(params.projectId);
    if (project === null) {
      return `Unknown project ${params.projectId}`;
    }

    return project.getName();
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
  getRelativeMatchParams_(matches: {[key: string]: string}): CP {
    return {
      projectId: matches['projectId'],
    };
  }

  /**
   * @override
   */
  protected getRelativePath_(params: CP): string {
    return `/project/${params.projectId}`;
  }
}
// TODO: Mutable
