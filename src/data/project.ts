import { cache, Serializable } from 'external/gs_tools/src/data';
import { DataModel, DataModels, field } from 'external/gs_tools/src/datamodel';
import { ImmutableMap } from 'external/gs_tools/src/immutable';

export type ProjectSearchIndex = {
  name: string,
  this: Project,
};

export function generateSearchIndex(instance: Project): ProjectSearchIndex {
  return {
    name: instance.getName(),
    this: instance,
  };
}

@Serializable('project')
export abstract class Project implements DataModel<ProjectSearchIndex> {
  @field('id') protected readonly id_: string = '';
  @field('name') protected readonly name_: string = '';

  abstract getId(): string;

  abstract getName(): string;

  @cache()
  getSearchIndex(): ProjectSearchIndex {
    return {
      name: this.name_,
      this: this,
    };
  }

  abstract setName(name: string): Project;

  static withId(id: string): Project {
    return DataModels.newInstance<Project>(
        Project,
        ImmutableMap.of([['id_', id]]));
  }
}
