import { inject } from 'external/gs_tools/src/inject';
import { StringParser } from 'external/gs_tools/src/parse';
import { customElement, DomHook, handle, hook } from 'external/gs_tools/src/webc';
import { RouteService, RouteServiceEvents } from 'external/gs_ui/src/routing';

import { BaseThemedElement } from 'external/gs_ui/src/common';
import { ThemeService } from 'external/gs_ui/src/theming';

import { Project } from '../data/project';
import { ProjectCollection } from '../data/project-collection';
import { Editor } from '../project/editor';
import { RouteFactoryService } from '../routing/route-factory-service';
import { Views } from '../routing/views';


/**
 * Settings
 */
@customElement({
  dependencies: [Editor, ProjectCollection, RouteService],
  tag: 'pa-project-settings-view',
  templateKey: 'src/project/settings-view',
})
export class SettingsView extends BaseThemedElement {
  @hook('#editor').attribute('project-name', StringParser)
  readonly editorProjectNameHook_: DomHook<string> = DomHook.of<string>();

  @hook('#name').innerText()
  readonly nameInnerTextHook_: DomHook<string> = DomHook.of<string>();

  constructor(
      @inject('pa.data.ProjectCollection')
      private readonly projectCollection_: ProjectCollection,
      @inject('pa.routing.RouteFactoryService')
      private readonly routeFactoryService_: RouteFactoryService,
      @inject('gs.routing.RouteService')
      private readonly routeService_: RouteService<Views>,
      @inject('theming.ThemeService')
      themeService: ThemeService) {
    super(themeService);
  }

  private async getProject_(): Promise<Project | null> {
    const params = this.routeService_.getParams(this.routeFactoryService_.projectSettings());
    if (params === null) {
      return null;
    }

    return this.projectCollection_.get(params.projectId);
  }

  onCreated(element: HTMLElement): void {
    super.onCreated(element);
    this.listenTo(
        this.routeService_,
        RouteServiceEvents.CHANGED,
        this.onRouteChanged_);
    this.onRouteChanged_();
  }

  @handle('#editor').attributeChange('project-name')
  async onEditorProjectNameChanged_(): Promise<void> {
    const project = await this.getProject_();
    if (project === null) {
      return;
    }

    const projectName = this.editorProjectNameHook_.get();
    if (projectName === null) {
      return;
    }

    project.setName(projectName);
    this.projectCollection_.update(project);
  }

  private async onRouteChanged_(): Promise<void> {
    const project = await this.getProject_();
    if (project === null) {
      return;
    }

    const projectName = project.getName();
    this.nameInnerTextHook_.set(projectName);
    this.editorProjectNameHook_.set(projectName);
  }
}
