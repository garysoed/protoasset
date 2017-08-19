import { AbstractRouteFactory } from 'external/gs_ui/src/routing';

import { FuseBackedManager } from '../data/fuse-backed-manager';
import { Project, ProjectSearchIndex } from '../data/project';
import { ProjectManager } from '../data/project-manager';
import { Views } from '../routing/views';

type CP = {};
type PR = {projectId: string};
type CR = CP & PR;

type ProjectManagerType = FuseBackedManager<ProjectSearchIndex, Project>;

export class ProjectSettingsRouteFactory extends AbstractRouteFactory<Views, CP, CR, PR> {
  private readonly projectManager_: ProjectManagerType = ProjectManager;

  constructor(
      parent: AbstractRouteFactory<Views, any, PR, any>) {
    super(Views.PROJECT_SETTINGS, parent);
  }

  /**
   * @override
   */
  async getName(params: CR): Promise<string> {
    const project = await this.projectManager_.monad().get().get(params.projectId);
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
  getRelativeMatchParams_(): CP {
    return {};
  }

  /**
   * @override
   */
  protected getRelativePath_(): string {
    return '/settings';
  }
}
// TODO: Mutable
