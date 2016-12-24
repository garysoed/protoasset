import {Field, Serializable} from 'external/gs_tools/src/data';


export type ProjectSearchIndex = {
  name: string,
  this: Project,
};

/**
 * Represents a project
 */
@Serializable('project')
export class Project {
  @Field('id') private id_: string;
  @Field('name') private name_: string;

  constructor(id: string) {
    this.id_ = id;
    this.name_ = 'Unnamed Project';
  }

  /**
   * @return The ID of the project.
   */
  getId(): string {
    return this.id_;
  }

  /**
   * @return The name of the project.
   */
  getName(): string {
    return this.name_;
  }

  /**
   * @return The index used for searching.
   */
  getSearchIndex(): ProjectSearchIndex {
    return {
      name: this.name_,
      this: this,
    };
  }

  /**
   * Sets the project name.
   *
   * @param name The name to set.
   */
  setName(name: string): void {
    this.name_ = name;
  }
}
