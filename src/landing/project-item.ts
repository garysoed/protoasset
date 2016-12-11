import {bind, customElement, DomBridge, handle, StringParser} from 'external/gs_tools/src/webc';
import {inject} from 'external/gs_tools/src/inject';

import {BaseThemedElement} from 'external/gs_ui/src/common';
import {ThemeService} from 'external/gs_ui/src/theming';

import {Project} from '../data/project';
import {ProjectCollection} from '../data/project-collection';


@customElement({
  tag: 'pa-project-item',
  templateKey: 'src/landing/project-item',
})
export class ProjectItem extends BaseThemedElement {
  private readonly projectCollection_: ProjectCollection;

  @bind('#projectName').innerText()
  private readonly projectNameBridge_: DomBridge<string>;

  constructor(
      @inject('pa.data.ProjectCollection') projectCollection: ProjectCollection,
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);

    this.projectCollection_ = projectCollection;
    this.projectNameBridge_ = DomBridge.of<string>();
  }

  @handle(null).attributeChange('project-id', StringParser)
  protected onProjectIdChanged_(newId: string): Promise<void> {
    return this.projectCollection_
        .get(newId)
        .then((project: Project | null) => {
          if (project !== null) {
            this.projectNameBridge_.set(project.getName());
          } else {
            this.projectNameBridge_.delete();
          }
        });
  }
}
