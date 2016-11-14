import {Field, Serializable} from 'external/gs_tools/src/data';
import {Random} from 'external/gs_tools/src/random';


@Serializable('asset')
export class Asset {
  @Field('id') private id_: string;
  @Field('name') private name_: string;
  @Field('projectId') private projectId_: string;

  constructor(projectId: string) {
    this.id_ = `${projectId}_${Random().shortId()}`;
    this.name_ = 'Unnamed Asset';
    this.projectId_ = projectId;
  }

  getId(): string {
    return this.id_;
  }

  getName(): string {
    return this.name_;
  }

  setName(name: string): void {
    this.name_ = name;
  }
}
