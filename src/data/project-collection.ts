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
   * @return A list of projects in the storage.
   */
  list(): Promise<Project[]> {
    return this.storage_
        .list()
        .then((ids: string[]) => {
          return Arrays
              .of(ids)
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
}
