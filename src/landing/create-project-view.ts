import { DataAccess, DataModels } from 'external/gs_tools/src/datamodel';
import { ImmutableMap, ImmutableSet } from 'external/gs_tools/src/immutable';
import { inject } from 'external/gs_tools/src/inject';
import { BooleanParser, StringParser } from 'external/gs_tools/src/parse';
import {
    customElement,
    dom,
    domOut,
    onDom} from 'external/gs_tools/src/webc';

import { monad, monadOut, MonadSetter } from 'external/gs_tools/src/event';
import { BaseThemedElement2 } from 'external/gs_ui/src/common';
import { RouteService } from 'external/gs_ui/src/routing';
import { ThemeService } from 'external/gs_ui/src/theming';

import { Project } from '../data/project';
import { ProjectManager } from '../data/project-manager';
import { Editor } from '../project/editor';
import { RouteFactoryService } from '../routing/route-factory-service';
import { Views } from '../routing/views';

const CANCEL_BUTTON_EL = '#cancelButton';
const CREATE_BUTTON_EL = '#createButton';
const EDITOR_EL = '#editor';

const CREATE_BUTTON_DISABLED_ATTR = {
  name: 'disabled',
  parser: BooleanParser,
  selector: CREATE_BUTTON_EL,
};
const EDITOR_PROJECT_NAME_ATTR = {name: 'project-name', parser: StringParser, selector: EDITOR_EL};

/**
 * The main landing view of the app.
 */
@customElement({
  dependencies: ImmutableSet.of([Editor]),
  tag: 'pa-create-project-view',
  templateKey: 'src/landing/create-project-view',
})
export class CreateProjectView extends BaseThemedElement2 {
  private readonly routeFactoryService_: RouteFactoryService;
  private readonly routeService_: RouteService<Views>;

  /**
   * @param themeService
   * @param projectCollection
   */
  constructor(
      @inject('theming.ThemeService') themeService: ThemeService,
      @inject('pa.routing.RouteFactoryService') routeFactoryService: RouteFactoryService,
      @inject('gs.routing.RouteService') routeService: RouteService<Views>) {
    super(themeService);
    this.routeFactoryService_ = routeFactoryService;
    this.routeService_ = routeService;
  }

  /**
   * Handles event when the cancel button is clicked.
   */
  @onDom.event(CANCEL_BUTTON_EL, 'gs-action')
  onCancelAction_(
      @domOut.attribute(EDITOR_PROJECT_NAME_ATTR) projectNameSetter: MonadSetter<string | null>):
      ImmutableMap<string, any> {
    this.routeService_.goTo(this.routeFactoryService_.landing(), {});
    return this.reset_(projectNameSetter);
  }

  /**
   * Handles event when the name field has changed.
   */
  @onDom.attributeChange(EDITOR_PROJECT_NAME_ATTR)
  onNameChange_(
      @dom.attribute(EDITOR_PROJECT_NAME_ATTR) projectName: string | null,
      @domOut.attribute(CREATE_BUTTON_DISABLED_ATTR)
          {id: createButtonDisabledId}: MonadSetter<boolean> ): ImmutableMap<string, any> {
    return ImmutableMap.of([
      [createButtonDisabledId, !projectName],
    ]);
  }

  /**
   * Handles event when the submit button is clicked.
   *
   * @return Promise that will be resolved when all handling logic have completed.
   */
  @onDom.event(CREATE_BUTTON_EL, 'gs-action')
  async onSubmitAction_(
      @monad(ProjectManager.idMonad()) newId: string,
      @domOut.attribute(EDITOR_PROJECT_NAME_ATTR) projectNameSetter: MonadSetter<string | null>,
      @monadOut(ProjectManager.monad())
          {id: projectAccessId, value: projectAccess}: MonadSetter<DataAccess<Project>>):
      Promise<ImmutableMap<string, any>> {
    const projectName = projectNameSetter.value;
    if (projectName === null) {
      throw new Error('Project name is not set');
    }

    const project = DataModels.newInstance<Project>(Project).setName(projectName);

    this.routeService_.goTo(this.routeFactoryService_.assetList(), {projectId: newId});
    return this.reset_(projectNameSetter)
        .set(projectAccessId, projectAccess.queueUpdate(newId, project));
  }

  /**
   * Resets the form.
   */
  private reset_({id: projectNameId}: MonadSetter<string | null>): ImmutableMap<string, any> {
    return ImmutableMap.of([[projectNameId, '']]);
  }
}
