import { cache, Field, Serializable } from 'external/gs_tools/src/data';

import { DataModel } from '../data/data-model';

export type ProjectSearchIndex = {
  name: string,
  this: Project2,
};

@Serializable('project')
export class Project2 extends DataModel<ProjectSearchIndex> {
  @Field('id') private readonly id_: string;
  @Field('name') private readonly name_: string;

  constructor(id: string, name: string) {
    super();
    this.id_ = id;
    this.name_ = name;
  }

  getId(): string {
    return this.id_;
  }

  getName(): string {
    return this.name_;
  }

  @cache()
  getSearchIndex(): ProjectSearchIndex {
    return {
      name: this.name_,
      this: this,
    };
  }

  setName(name: string): Project2 {
    return new Project2(this.id_, name);
  }
}
