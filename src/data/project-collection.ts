import { BaseListenable } from 'external/gs_tools/src/event';
import { bind, inject } from 'external/gs_tools/src/inject';
import { CachedStorage, LocalStorage } from 'external/gs_tools/src/store';

import { CollectionEvents } from './collection-events';
import { CollectionStorage } from './collection-storage';
import { Project, ProjectSearchIndex } from './project';


/**
 * Represents a collection of projects.
 */
@bind('pa.data.ProjectCollection')
export class ProjectCollection extends BaseListenable<CollectionEvents> {
  private readonly storage_: CollectionStorage<Project, ProjectSearchIndex>;

  constructor(@inject('x.dom.window') window: Window) {
    super();
    const cachedStorage = CachedStorage.of(LocalStorage.of<Project>(window, 'pa.projects'));
    this.addDisposable(cachedStorage);
    this.storage_ = new CollectionStorage<Project, ProjectSearchIndex>(
        ProjectCollection.getSearchIndex_,
        cachedStorage);
  }

  /**
   * @return The promise that will be resolved with the requested project, or null if it does not
   *    exist.
   */
  get(projectId: string): Promise<Project | null> {
    return this.storage_.get(projectId);
  }

  /**
   * @return A list of projects in the storage.
   */
  list(): Promise<Project[]> {
    return this.storage_.list();
  }

  /**
   * Reserves an ID for creating a new project.
   *
   * @return Promise that will be resolved with the project ID that is guaranteed to be unique.
   */
  reserveId(): Promise<string> {
    return this.storage_.reserveId();
  }

  /**
   * Searches for Projects that satisfies the given token.
   * @param token The search token.
   * @return Promise that will be resolved with the projects.
   */
  search(token: string): Promise<Project[]> {
    return this.storage_.search(token);
  }

  /**
   * Updates the given project.
   *
   * @param project
   */
  async update(project: Project): Promise<void> {
    const isNewProject = await this.storage_.update(project.getId(), project);
    if (isNewProject) {
      this.dispatch(CollectionEvents.ADDED, () => undefined, project);
    }
  }

  /**
   * @param project Project whose search index should be returned.
   * @return The search index of the given project.
   */
  private static getSearchIndex_(project: Project): ProjectSearchIndex {
    return project.getSearchIndex();
  }
}
