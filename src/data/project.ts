import {Field, Serializable} from 'external/gs_tools/src/data';
import {Random} from 'external/gs_tools/src/random';


/**
 * Represents a project
 */
@Serializable('project')
export class Project {
  @Field('assets') private assetIds_: {[key: string]: string};
  @Field('id') private id_: string;
  @Field('name') private name_: string;

  constructor() {
    this.assetIds_ = {};
    this.id_ = Random().shortId();
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
   * Sets the project name.
   *
   * @param name The name to set.
   */
  setName(name: string): void {
    this.name_ = name;
  }
}
