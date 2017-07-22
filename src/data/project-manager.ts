import { Log } from 'external/gs_tools/src/util';

import { FuseBackedManager } from '../data/fuse-backed-manager';
import { Project, ProjectSearchIndex } from '../data/project';

const LOGGER: Log = Log.of('protoasset.data.ProjectManager');

class ProjectManagerImpl extends FuseBackedManager<ProjectSearchIndex, Project> {
  static of(window: Window): ProjectManagerImpl {
    return new ProjectManagerImpl('pa.projects', LOGGER, window);
  }
}

export const ProjectManager = ProjectManagerImpl.of(window);
