import { AbstractRouteFactory } from 'external/gs_ui/src/routing';

import { ProjectCollection } from '../data/project-collection';
import { Views } from '../routing/views';

type CP = {};
type PR = {projectId: string};
type CR = CP & PR;

export class ProjectSettingsRouteFactory extends AbstractRouteFactory<Views, CP, CR, PR> {

  constructor(
      private readonly projectCollection_: ProjectCollection,
      parent: AbstractRouteFactory<Views, any, PR, any>) {
    super(Views.PROJECT_SETTINGS, parent);
  }

  /**
   * @override
   */
  async getName(params: CR): Promise<string> {
    const project = await this.projectCollection_.get(params.projectId);
    if (project === null) {
      return 'Settings';
    }

    return `Settings for ${project.getName()}`;
  }

  /**
   * @override
   */
  getRelativeMatcher_(): string {
    return '/settings';
  }

  /**
   * @override
   */
  getRelativeMatchParams_(matches: {[key: string]: string}): CP {
    return {};
  }

  /**
   * @override
   */
  protected getRelativePath_(params: CP): string {
    return '/settings';
  }
}
// TODO: Mutable
