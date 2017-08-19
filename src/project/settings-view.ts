import { ImmutableSet } from 'external/gs_tools/src/immutable';
import { inject } from 'external/gs_tools/src/inject';
import { StringParser } from 'external/gs_tools/src/parse';
import { customElement, DomHook, handle, hook } from 'external/gs_tools/src/webc';
import { RouteService } from 'external/gs_ui/src/routing';

import { BaseThemedElement } from 'external/gs_ui/src/common';
import { RouteServiceEvents } from 'external/gs_ui/src/const';
import { ThemeService } from 'external/gs_ui/src/theming';

import { FuseBackedManager } from '../data/fuse-backed-manager';
import { Project, ProjectSearchIndex } from '../data/project';
import { ProjectManager } from '../data/project-manager';
import { Editor } from '../project/editor';
import { RouteFactoryService } from '../routing/route-factory-service';
import { Views } from '../routing/views';

type ProjectManagerType = FuseBackedManager<ProjectSearchIndex, Project>;

/**
 * Settings
 */
@customElement({
  dependencies: ImmutableSet.of([Editor, RouteService]),
  tag: 'pa-project-settings-view',
  templateKey: 'src/project/settings-view',
})
export class SettingsView extends BaseThemedElement {
  @hook('#editor').attribute('project-name', StringParser)
  readonly editorProjectNameHook_: DomHook<string> = DomHook.of<string>();

  @hook('#name').innerText()
  readonly nameInnerTextHook_: DomHook<string> = DomHook.of<string>();

  private readonly projectManager_: ProjectManagerType = ProjectManager;

  constructor(
      @inject('pa.routing.RouteFactoryService')
      private readonly routeFactoryService_: RouteFactoryService,
      @inject('gs.routing.RouteService')
      private readonly routeService_: RouteService<Views>,
      @inject('theming.ThemeService')
      themeService: ThemeService) {
    super(themeService);
  }

  private async getProject_(): Promise<Project | null> {
    const route = this.routeService_.monad()
        .get().getRoute(this.routeFactoryService_.projectSettings());
    if (route === null) {
      return null;
    }

    return this.projectManager_.monad().get().get(route.params.projectId);
  }

  onCreated(element: HTMLElement): void {
    super.onCreated(element);
    this.addDisposable(
        this.routeService_.on(RouteServiceEvents.CHANGED, this.onRouteChanged_, this));
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

    const projectManagerMonad = this.projectManager_.monad();
    projectManagerMonad.set(
        projectManagerMonad.get().queueUpdate(project.getId(), project.setName(projectName)));
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
// TODO: Mutable
