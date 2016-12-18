import {Field, Serializable} from 'external/gs_tools/src/data';


@Serializable('asset')
export class Asset {
  @Field('id') private id_: string;
  @Field('name') private name_: string;
  @Field('projectId') private projectId_: string;

  constructor(id: string, projectId: string) {
    this.id_ = id;
    this.name_ = 'Unnamed Asset';
    this.projectId_ = projectId;
  }

  /**
   * @return ID of the asset.
   */
  getId(): string {
    return this.id_;
  }

  /**
   * @return Name of the asset.
   */
  getName(): string {
    return this.name_;
  }

  /**
   * Sets the name of the asset.
   *
   * @param name The name of the asset.
   */
  setName(name: string): void {
    this.name_ = name;
  }
}
