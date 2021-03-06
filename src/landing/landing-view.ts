import { DataAccess, ManagerEvent } from 'external/gs_tools/src/datamodel';
import { eventDetails, monad, monadOut, on } from 'external/gs_tools/src/event';
import { ImmutableList, ImmutableSet } from 'external/gs_tools/src/immutable';
import { inject } from 'external/gs_tools/src/inject';
import { MonadSetter, MonadValue } from 'external/gs_tools/src/interfaces';
import { StringParser } from 'external/gs_tools/src/parse';
import {
  customElement,
  dom,
  domOut,
  onDom,
  onLifecycle} from 'external/gs_tools/src/webc';

import { BaseThemedElement2 } from 'external/gs_ui/src/common';
import { RouteServiceEvents } from 'external/gs_ui/src/const';
import { RouteNavigator, RouteService } from 'external/gs_ui/src/routing';
import { ThemeService } from 'external/gs_ui/src/theming';

import { FilterButton } from '../common/filter-button';
import { Project } from '../data/project';
import { ProjectManager } from '../data/project-manager';
import { ProjectItem } from '../landing/project-item';
import { RouteFactoryService } from '../routing/route-factory-service';
import { Views } from '../routing/views';

const CREATE_BUTTON_EL = '#createButton';
const FILTER_BUTTON_EL = '#filterButton';
const PROJECTS_EL = '#projects';
const FILTER_TEXT_ATTR = {name: 'filter-text', parser: StringParser, selector: FILTER_BUTTON_EL};
export const PROJECT_COLLECTION_CHILDREN = {
  bridge: {
    create(document: Document): Element {
      return document.createElement('pa-project-item');
    },

    get(element: Element): string | null {
      return element.getAttribute('project-id');
    },

    set(projectId: string, element: Element): void {
      element.setAttribute('project-id', projectId);
    },
  },
  selector: PROJECTS_EL,
};

/**
 * The main landing view of the app.
 */
@customElement({
  dependencies: ImmutableSet.of([FilterButton, ProjectItem, RouteService]),
  tag: 'pa-landing-view',
  templateKey: 'src/landing/landing-view',
})
export class LandingView extends BaseThemedElement2 {
  private readonly routeFactoryService_: RouteFactoryService;
  private readonly routeService_: RouteService<Views>;

  constructor(
      @inject('theming.ThemeService') themeService: ThemeService,
      @inject('pa.routing.RouteFactoryService') routeFactoryService: RouteFactoryService,
      @inject('gs.routing.RouteService') routeService: RouteService<Views>) {
    super(themeService);
    this.routeFactoryService_ = routeFactoryService;
    this.routeService_ = routeService;
  }

  /**
   * Handles event when the location was changed.
   */
  @on((instance: LandingView) => instance.routeService_, RouteServiceEvents.CHANGED)
  @onLifecycle('create')
  async initialize_(
      @monad(ProjectManager.monad()) projectAccess: DataAccess<Project>,
      @monadOut((view: LandingView) => view.routeService_.monad())
          routeSetter: MonadSetter<RouteNavigator<Views>>): Promise<MonadValue<any>[]> {
    const match = routeSetter.value.getMatch();
    if (match === null) {
      return [
        routeSetter.set(routeSetter.value.goTo(this.routeFactoryService_.landing(), {})),
      ];
    }

    if (match.type === Views.LANDING) {
      const projects = await projectAccess.list();
      if (projects.size() === 0) {
        return [
          routeSetter.set(routeSetter.value.goTo(this.routeFactoryService_.createProject(), {})),
        ];
      }
    }

    return [];
  }

  /**
   * Handles event when the create button is clicked.
   */
  @onDom.event(CREATE_BUTTON_EL, 'gs-action')
  onCreateAction_(
      @monadOut((view: LandingView) => view.routeService_.monad())
          routeSetter: MonadSetter<RouteNavigator<Views>>): MonadValue<any>[] {
    return [
      routeSetter.set(routeSetter.value.goTo(this.routeFactoryService_.createProject(), {})),
    ];
  }

  @onDom.attributeChange(FILTER_TEXT_ATTR)
  async onFilterButtonTextAttrChange_(
      @dom.attribute(FILTER_TEXT_ATTR) filterText: string | null,
      @domOut.childElements(PROJECT_COLLECTION_CHILDREN)
          projectIdsSetter: MonadSetter<ImmutableList<string>>,
      @monad(ProjectManager.monad()) projectAccess: DataAccess<Project>):
      Promise<Iterable<MonadValue<any>>> {
    const projectsPromise = (filterText === null || filterText === '')
        ? projectAccess.list()
        : projectAccess.search(filterText);

    const projects = await projectsPromise;
    const projectIds = ImmutableList.of(projects)
        .map((project: Project) => {
          return project.getId();
        });
    return ImmutableList.of([projectIdsSetter.set(projectIds)]);
  }

  /**
   * @override
   */
  @onLifecycle('insert')
  async onInserted(
      @domOut.childElements(PROJECT_COLLECTION_CHILDREN)
          projectIdsSetter: MonadSetter<ImmutableList<string>>,
      @monad(ProjectManager.monad()) projectAccess: DataAccess<Project>):
      Promise<Iterable<MonadValue<any>>> {
    const projects = await projectAccess.list();
    const projectIds = ImmutableList.of(projects
        .mapItem((project: Project) => {
          return project.getId();
        }));
    return ImmutableList.of([projectIdsSetter.set(projectIds)]);
  }

  /**
   * Handles when a project is added.
   * @param project The added project.
   */
  @on(ProjectManager, 'add')
  onProjectAdded_(
      @domOut.childElements(PROJECT_COLLECTION_CHILDREN)
          projectIdsSetter: MonadSetter<ImmutableList<string>>,
      @eventDetails() {data: project}: ManagerEvent<Project>): Iterable<MonadValue<any>> {
    return ImmutableList.of([
      projectIdsSetter.set(projectIdsSetter.value.add(project.getId())),
    ]);
  }
}
