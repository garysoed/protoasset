import { DataAccess } from 'external/gs_tools/src/datamodel';
import { monad, monadOut, on } from 'external/gs_tools/src/event';
import { ImmutableSet } from 'external/gs_tools/src/immutable';
import { inject } from 'external/gs_tools/src/inject';
import { MonadSetter, MonadValue } from 'external/gs_tools/src/interfaces';
import { DataModelParser, StringParser } from 'external/gs_tools/src/parse';
import { customElement, dom, domOut, onDom, onLifecycle } from 'external/gs_tools/src/webc';

import { BaseThemedElement2 } from 'external/gs_ui/src/common';
import { RouteServiceEvents } from 'external/gs_ui/src/const';
import { RouteNavigator, RouteService } from 'external/gs_ui/src/routing';
import { ThemeService } from 'external/gs_ui/src/theming';
import { DownloadService } from 'external/gs_ui/src/tool';

import { Project } from '../data/project';
import { ProjectManager } from '../data/project-manager';
import { Editor } from '../project/editor';
import { RouteFactoryService } from '../routing/route-factory-service';
import { Views } from '../routing/views';

const DOWNLOAD_EL = '#downloadButton';
const EDITOR_EL = '#editor';
const NAME_EL = '#name';
const EDITOR_NAME_ATTR = {name: 'project-name', parser: StringParser, selector: EDITOR_EL};
const NAME_INNER_TEXT = {parser: StringParser, selector: NAME_EL};

/**
 * Settings
 */
@customElement({
  dependencies: ImmutableSet.of([DownloadService, Editor, RouteService]),
  tag: 'pa-project-settings-view',
  templateKey: 'src/project/settings-view',
})
export class SettingsView extends BaseThemedElement2 {
  constructor(
      @inject('gs.tool.DownloadService') private readonly downloadService_: DownloadService,
      @inject('pa.routing.RouteFactoryService')
          private readonly routeFactoryService_: RouteFactoryService,
      @inject('gs.routing.RouteService')
          private readonly routeService_: RouteService<Views>,
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);
  }

  private async getProject_(
      routeNavigator: RouteNavigator<Views>,
      projectAccess: DataAccess<Project>): Promise<Project | null> {
    const route = routeNavigator.getRoute(this.routeFactoryService_.projectSettings());
    if (route === null) {
      return null;
    }

    return projectAccess.get(route.params.projectId);
  }

  @onDom.event(DOWNLOAD_EL, 'click')
  async onDownloadClick_(
      @monad((view: SettingsView) => view.routeService_.monad())
          routeNavigator: RouteNavigator<Views>,
      @monad(ProjectManager.monad()) projectAccess: DataAccess<Project>): Promise<void> {
    const project = await this.getProject_(routeNavigator, projectAccess);
    if (!project) {
      return;
    }

    this.downloadService_.downloadString(
        DataModelParser<Project>().stringify(project),
        `${project.getName()}.pa`);
    // TODO: Implement
    throw new Error('Unimplemented');
  }

  @onDom.attributeChange(EDITOR_NAME_ATTR)
  async onEditorProjectNameChanged_(
      @dom.attribute(EDITOR_NAME_ATTR) projectName: string | null,
      @monad((view: SettingsView) => view.routeService_.monad())
          routeNavigator: RouteNavigator<Views>,
      @monadOut(ProjectManager.monad()) projectSetter: MonadSetter<DataAccess<Project>>):
      Promise<MonadValue<any>[]> {
    if (projectName === null) {
      return [];
    }

    const project = await this.getProject_(routeNavigator, projectSetter.value);
    if (project === null) {
      return [];
    }

    return [
      projectSetter.set(projectSetter.value.queueUpdate(
          project.getId(), project.setName(projectName))),
    ];
  }

  @onLifecycle('create')
  @on((view: SettingsView) => view.routeService_, RouteServiceEvents.CHANGED)
  async onRouteChanged_(
      @monad((view: SettingsView) => view.routeService_.monad())
          routeNavigator: RouteNavigator<Views>,
      @monad(ProjectManager.monad()) projectAccess: DataAccess<Project>,
      @domOut.attribute(EDITOR_NAME_ATTR) editorNameSetter: MonadSetter<string | null>,
      @domOut.innerText(NAME_INNER_TEXT) nameSetter: MonadSetter<string | null>):
      Promise<MonadValue<any>[]> {
    const project = await this.getProject_(routeNavigator, projectAccess);
    if (project === null) {
      return [];
    }

    const projectName = project.getName();
    return [
      editorNameSetter.set(projectName),
      nameSetter.set(projectName),
    ];
  }
}
