import { DataAccess, ManagerEvent } from 'external/gs_tools/src/datamodel';
import {
  ImmutableList,
  ImmutableSet,
  Iterables } from 'external/gs_tools/src/immutable';
import { inject } from 'external/gs_tools/src/inject';
import {
  customElement,
  dom,
  domOut,
  onDom,
  onLifecycle} from 'external/gs_tools/src/webc';

import { eventDetails, monad, on } from 'external/gs_tools/src/event';
import { StringParser } from 'external/gs_tools/src/parse';
import { BaseThemedElement2 } from 'external/gs_ui/src/common';
import { RouteServiceEvents } from 'external/gs_ui/src/const';
import { RouteService } from 'external/gs_ui/src/routing';
import { ThemeService } from 'external/gs_ui/src/theming';

import { MonadSetter } from "external/gs_tools/src/interfaces";
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
   * Handles event when the create button is clicked.
   */
  @onDom.event(CREATE_BUTTON_EL, 'gs-action')
  onCreateAction_(): void {
    this.routeService_.goTo(this.routeFactoryService_.createProject(), {});
  }

  /**
   * @override
   */
  @onLifecycle('create')
  onCreated(@monad(ProjectManager.monad()) projectAccess: DataAccess<Project>): void {
    this.onRouteChanged_(projectAccess);
  }


  @onDom.attributeChange(FILTER_TEXT_ATTR)
  async onFilterButtonTextAttrChange_(
      @dom.attribute(FILTER_TEXT_ATTR) filterText: string | null,
      @domOut.childElements(PROJECT_COLLECTION_CHILDREN)
          projectIdsSetter: MonadSetter<ImmutableList<string>>,
      @monad(ProjectManager.monad()) projectAccess: DataAccess<Project>):
      Promise<ImmutableList<MonadSetter<any>>> {
    const projectsPromise = (filterText === null || filterText === '')
        ? projectAccess.list()
        : projectAccess.search(filterText);

    const projects = await projectsPromise;
    const normalizedProjects = projects instanceof Array ? projects : Iterables.toArray(projects);
    projectIdsSetter.value = ImmutableList.of(normalizedProjects)
        .map((project: Project) => {
          return project.getId();
        });
    return ImmutableList.of([projectIdsSetter]);
  }

  /**
   * @override
   */
  @onLifecycle('insert')
  async onInserted(
      @domOut.childElements(PROJECT_COLLECTION_CHILDREN)
          projectIdsSetter: MonadSetter<ImmutableList<string>>,
      @monad(ProjectManager.monad()) projectAccess: DataAccess<Project>):
      Promise<ImmutableList<MonadSetter<any>>> {
    const projects = await projectAccess.list();
    projectIdsSetter.value = ImmutableList.of(projects
        .mapItem((project: Project) => {
          return project.getId();
        }));
    return ImmutableList.of([projectIdsSetter]);
  }

  /**
   * Handles when a project is added.
   * @param project The added project.
   */
  @on(ProjectManager, 'add')
  onProjectAdded_(
      @domOut.childElements(PROJECT_COLLECTION_CHILDREN)
          projectIdsSetter: MonadSetter<ImmutableList<string>>,
      @eventDetails() {data: project}: ManagerEvent<Project>): ImmutableList<MonadSetter<any>> {
    projectIdsSetter.value = projectIdsSetter.value.add(project.getId());
    return ImmutableList.of([projectIdsSetter]);
  }
  /**
   * Handles event when the location was changed.
   */
  @on((instance: LandingView) => instance.routeService_, RouteServiceEvents.CHANGED)
  async onRouteChanged_(
      @monad(ProjectManager.monad()) projectAccess: DataAccess<Project>): Promise<void> {
    const route = this.routeService_.getRoute();
    if (route === null) {
      this.routeService_.goTo(this.routeFactoryService_.landing(), {});
      return;
    }

    if (route.getType() === Views.LANDING) {
      const projects = await projectAccess.list();
      if (projects.size() === 0) {
        this.routeService_.goTo(this.routeFactoryService_.createProject(), {});
      }
    }
  }
}
