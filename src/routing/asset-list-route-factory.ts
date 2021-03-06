import { ImmutableMap } from 'external/gs_tools/src/immutable';
import { AbstractRouteFactory } from 'external/gs_ui/src/routing';

import { ProjectManager } from '../data/project-manager';
import { Views } from '../routing/views';

type CP = {projectId: string};
type PR = {};
type CR = CP & PR;

export class AssetListRouteFactory extends AbstractRouteFactory<Views, CP, CR, PR> {

  constructor(
      parent: AbstractRouteFactory<Views, any, PR, any>) {
    super(Views.PROJECT, parent);
  }

  /**
   * @override
   */
  async getName(params: CR): Promise<string> {
    const project = await ProjectManager.monad().get().get(params.projectId);
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
  getRelativeMatchParams_(matches: ImmutableMap<string, string>): CP {
    const projectId = matches.get('projectId');
    if (!projectId) {
      throw new Error(`No values found for project Id: ${projectId}`);
    }
    return {projectId};
  }

  /**
   * @override
   */
  protected getRelativePath_(params: CP): string {
    return `/project/${params.projectId}`;
  }
}
