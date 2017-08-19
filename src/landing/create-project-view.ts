import { ImmutableList, ImmutableSet } from 'external/gs_tools/src/immutable';
import { inject } from 'external/gs_tools/src/inject';
import { BooleanParser, StringParser } from 'external/gs_tools/src/parse';
import {
    customElement,
    dom,
    domOut,
    onDom} from 'external/gs_tools/src/webc';

import { monad, monadOut } from 'external/gs_tools/src/event';
import { BaseThemedElement2 } from 'external/gs_ui/src/common';
import { RouteNavigator, RouteService } from 'external/gs_ui/src/routing';
import { ThemeService } from 'external/gs_ui/src/theming';

import { DataAccess } from 'external/gs_tools/src/datamodel';
import { MonadSetter, MonadValue } from 'external/gs_tools/src/interfaces';
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
  goToLanding_(
      @monadOut((instance: CreateProjectView) => instance.routeService_.monad())
          navigatorSetter: MonadSetter<RouteNavigator<Views>>): Iterable<MonadValue<any>> {
    return [
      navigatorSetter.set(navigatorSetter.value.goTo(this.routeFactoryService_.landing(), {})),
    ];
  }

  /**
   * Handles event when the name field has changed.
   */
  @onDom.attributeChange(EDITOR_PROJECT_NAME_ATTR)
  onNameChange_(
      @dom.attribute(EDITOR_PROJECT_NAME_ATTR) projectName: string | null,
      @domOut.attribute(CREATE_BUTTON_DISABLED_ATTR)
          createButtonDisabledSetter: MonadSetter<boolean> ): Iterable<MonadValue<any>> {
    return ImmutableList.of([createButtonDisabledSetter.set(!projectName)]);
  }

  /**
   * Handles event when the submit button is clicked.
   *
   * @return Promise that will be resolved when all handling logic have completed.
   */
  @onDom.event(CREATE_BUTTON_EL, 'gs-action')
  async onSubmitAction_(
      @monad(ProjectManager.idMonad()) newIdPromise: Promise<string>,
      @domOut.attribute(EDITOR_PROJECT_NAME_ATTR) projectNameSetter: MonadSetter<string | null>,
      @monadOut(ProjectManager.monad()) projectAccessSetter: MonadSetter<DataAccess<Project>>,
      @monadOut((instance: CreateProjectView) => instance.routeService_.monad())
          navigatorSetter: MonadSetter<RouteNavigator<Views>>):
      Promise<MonadValue<any>[]> {
    const projectName = projectNameSetter.value;
    if (projectName === null) {
      throw new Error('Project name is not set');
    }

    const newId = await newIdPromise;
    const project = Project.withId(newId).setName(projectName);
    return [
      projectAccessSetter.set(projectAccessSetter.value.queueUpdate(newId, project)),
      navigatorSetter.set(navigatorSetter.value.goTo(
          this.routeFactoryService_.assetList(), {projectId: newId})),
    ];
  }

  /**
   * Resets the form.
   */
  @onDom.event(CANCEL_BUTTON_EL, 'gs-action')
  @onDom.event(CREATE_BUTTON_EL, 'gs-action')
  reset_(@domOut.attribute(EDITOR_PROJECT_NAME_ATTR) projectNameSetter: MonadSetter<string | null>):
      MonadValue<any>[] {
    return [projectNameSetter.set('')];
  }
}
