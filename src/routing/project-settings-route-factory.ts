import { AbstractRouteFactory } from 'external/gs_ui/src/routing';

import { FuseBackedManager } from '../data/fuse-backed-manager';
import { ProjectManager } from '../data/project-manager';
import { Project2, ProjectSearchIndex } from '../data/project2';
import { Views } from '../routing/views';

type CP = {};
type PR = {projectId: string};
type CR = CP & PR;

type ProjectManagerType = FuseBackedManager<ProjectSearchIndex, Project2>;

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
    const project = await this.projectManager_.monad()(this).get().get(params.projectId);
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
