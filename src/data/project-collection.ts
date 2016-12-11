import {Arrays} from 'external/gs_tools/src/collection';
import {bind, inject} from 'external/gs_tools/src/inject';
import {LocalStorage} from 'external/gs_tools/src/store';

import {Project} from './project';


/**
 * Represents a collection of projects.
 */
@bind('pa.ProjectCollection')
export class ProjectCollection {
  private storage_: LocalStorage<Project>;

  constructor(@inject('x.dom.window') window: Window) {
    this.storage_ = new LocalStorage<Project>(window, 'pa.projects');
  }

  /**
   * @return The promise that will be resolved with the requested project, or null if it does not
   *    exist.
   */
  get(projectId: string): Promise<Project | null> {
    return this.storage_.read(projectId);
  }

  /**
   * @return A list of projects in the storage.
   */
  list(): Promise<Project[]> {
    return this.storage_
        .list()
        .then((ids: Set<string>) => {
          return Arrays
              .fromIterable(ids)
              .map((id: string) => {
                return this.storage_.read(id);
              })
              .asArray();
        })
        .then((promises: Promise<Project | null>[]) => {
          return Promise.all(promises);
        })
        .then((projects: (Project | null)[]) => {
          return Arrays
              .of(projects)
              .filter((project: Project | null) => {
                return project !== null;
              })
              .asArray();
        });
  }

  /**
   * Reserves an ID for creating a new project.
   *
   * @return Promise that will be resolved with the project ID that is guaranteed to be unique.
   */
  reserveId(): Promise<string> {
    return this.storage_.reserve();
  }

  /**
   * Updates the given project.
   *
   * @param project
   */
  update(project: Project): Promise<void> {
    return this.storage_.update(project.getId(), project);
  }
}
