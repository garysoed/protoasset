import { CachedStorage, LocalStorage } from 'external/gs_tools/src/store';
import { Log } from 'external/gs_tools/src/util';

import { Manager } from '../data/manager';
import { Project2, ProjectSearchIndex } from '../data/project2';

const LOGGER: Log = Log.of('protoasset.data.ProjectManager');

class ProjectManagerImpl extends Manager<ProjectSearchIndex, Project2> {
  static of(window: Window): ProjectManagerImpl {
    const cachedStorage = CachedStorage.of(LocalStorage.of<Project2>(window, 'pa.projects'));
    const manager = new ProjectManagerImpl(cachedStorage, LOGGER);
    manager.addDisposable(cachedStorage);
    return manager;
  }
}

export const ProjectManager = ProjectManagerImpl.of(window);
