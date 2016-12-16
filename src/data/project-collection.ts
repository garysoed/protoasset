import {Arrays} from 'external/gs_tools/src/collection';
import {BaseListenable} from 'external/gs_tools/src/event';
import {bind, inject} from 'external/gs_tools/src/inject';
import {LocalStorage} from 'external/gs_tools/src/store';

import {CollectionEvents} from './collection-events';
import {Project, ProjectSearchIndex} from './project';


/**
 * Represents a collection of projects.
 */
@bind('pa.data.ProjectCollection')
export class ProjectCollection extends BaseListenable<CollectionEvents> {
  private readonly storage_: LocalStorage<Project>;
  private fusePromise_: Promise<Fuse<ProjectSearchIndex>> | null = null;

  constructor(@inject('x.dom.window') window: Window) {
    super();
    this.storage_ = new LocalStorage<Project>(window, 'pa.projects');
  }

  /**
   * Creates a Fuse object.
   * @param indexes Search indexes to initialize the fuse with.
   * @return New instance of Fuse.
   */
  private createFuse_(indexes: ProjectSearchIndex[]): Fuse<ProjectSearchIndex> {
    // TODO: Common place for search config.
    return new Fuse<ProjectSearchIndex>(
        indexes,
        {
          keys: ['name'],
          shouldSort: true,
          threshold: 0.5,
        });
  }

  /**
   * Gets the promise that will be resolved with the fuse object initialized with the project
   * search indexes.
   * @return Promise that will be resolved with the fuse object.
   */
  private getFusePromise_(): Promise<Fuse<ProjectSearchIndex>> {
    if (this.fusePromise_ !== null) {
      return this.fusePromise_;
    }

    this.fusePromise_ = this
        .list()
        .then((projects: Project[]) => {
          let searchIndexes = Arrays
              .of(projects)
              .map((project: Project) => {
                return project.getSearchIndex();
              })
              .asArray();
          return this.createFuse_(searchIndexes);
        });
    return this.fusePromise_;
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
   * Searches for Projects that satisfies the given token.
   * @param token The search token.
   * @return Promise that will be resolved with the projects.
   */
  search(token: string): Promise<Project[]> {
    return this.getFusePromise_()
        .then((fuse: Fuse<ProjectSearchIndex>) => {
          let results = fuse.search(token);
          return Arrays
              .of(results)
              .map((result: ProjectSearchIndex) => {
                return result.this;
              })
              .asArray();
        });
  }

  /**
   * Updates the given project.
   *
   * @param project
   */
  update(project: Project): Promise<void> {
    return this.storage_
        .read(project.getId())
        .then((existingProject: Project | null) => {
          return Promise.all([
            existingProject === null,
            this.storage_.update(project.getId(), project),
          ]);
        })
        .then(([isNewProject]: [boolean, void]) => {
          if (isNewProject) {
            this.dispatch(CollectionEvents.ADDED, () => undefined, project);
          }
          this.fusePromise_ = null;
        });
  }
}
