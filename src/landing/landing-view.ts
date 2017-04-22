import { Arrays } from 'external/gs_tools/src/collection';
import { inject } from 'external/gs_tools/src/inject';
import { StringParser } from 'external/gs_tools/src/parse';
import {
  ChildElementDataHelper,
  customElement,
  DomHook,
  handle,
  hook } from 'external/gs_tools/src/webc';

import { BaseThemedElement } from 'external/gs_ui/src/common';
import { Event } from 'external/gs_ui/src/const';
import { RouteService, RouteServiceEvents } from 'external/gs_ui/src/routing';
import { ThemeService } from 'external/gs_ui/src/theming';

import { FilterButton } from '../common/filter-button';
import { CollectionEvents } from '../data/collection-events';
import { Project } from '../data/project';
import { ProjectCollection } from '../data/project-collection';
import { ProjectItem } from '../landing/project-item';
import { RouteFactoryService } from '../routing/route-factory-service';
import { Views } from '../routing/views';


export const PROJECT_ITEM_DATA_HELPER: ChildElementDataHelper<string> = {
  /**
   * @override
   */
  create(document: Document): Element {
    return document.createElement('pa-project-item');
  },

  /**
   * @override
   */
  get(element: Element): string | null {
    return element.getAttribute('project-id');
  },

  /**
   * @override
   */
  set(projectId: string, element: Element): void {
    element.setAttribute('project-id', projectId);
  },
};


/**
 * The main landing view of the app.
 */
@customElement({
  dependencies: [FilterButton, ProjectCollection, ProjectItem, RouteService],
  tag: 'pa-landing-view',
  templateKey: 'src/landing/landing-view',
})
export class LandingView extends BaseThemedElement {
  @hook('#projects').childrenElements(PROJECT_ITEM_DATA_HELPER)
  private readonly projectCollectionHook_: DomHook<string[]>;

  private readonly routeFactoryService_: RouteFactoryService;
  private readonly routeService_: RouteService<Views>;
  private readonly projectCollection_: ProjectCollection;

  constructor(
      @inject('theming.ThemeService') themeService: ThemeService,
      @inject('pa.data.ProjectCollection') projectCollection: ProjectCollection,
      @inject('pa.routing.RouteFactoryService') routeFactoryService: RouteFactoryService,
      @inject('gs.routing.RouteService') routeService: RouteService<Views>) {
    super(themeService);
    this.routeFactoryService_ = routeFactoryService;
    this.routeService_ = routeService;
    this.projectCollection_ = projectCollection;
    this.projectCollectionHook_ = DomHook.of<string[]>();
  }

  /**
   * Handles event when the location was changed.
   */
  private async onRouteChanged_(): Promise<void> {
    const route = this.routeService_.getRoute();
    if (route === null) {
      this.routeService_.goTo(this.routeFactoryService_.landing(), {});
      return;
    }

    if (route.getType() === Views.LANDING) {
      const projects = await this.projectCollection_.list();
      if (projects.length === 0) {
        this.routeService_.goTo(this.routeFactoryService_.createProject(), {});
      }
    }
  }

  /**
   * Handles event when the create button is clicked.
   */
  @handle('#createButton').event(Event.ACTION)
  protected onCreateAction_(): void {
    this.routeService_.goTo(this.routeFactoryService_.createProject(), {});
  }

  @handle('#filterButton').attributeChange('filter-text', StringParser)
  protected async onFilterButtonTextAttrChange_(newValue: string | null): Promise<void> {
    const projectsPromise = (newValue === null || newValue === '')
        ? this.projectCollection_.list()
        : this.projectCollection_.search(newValue);

    const projects = await projectsPromise;
    const projectIds = Arrays.of(projects)
        .map((project: Project) => {
          return project.getId();
        })
        .asArray();
    this.projectCollectionHook_.set(projectIds);
  }

  /**
   * Handles when a project is added.
   * @param project The added project.
   */
  private onProjectAdded_(project: Project): void {
    const projects = this.projectCollectionHook_.get() || [];
    projects.push(project.getId());
    this.projectCollectionHook_.set(projects);
  }

  /**
   * @override
   */
  onCreated(element: HTMLElement): void {
    super.onCreated(element);
    this.listenTo(this.routeService_, RouteServiceEvents.CHANGED, this.onRouteChanged_);
    this.listenTo(this.projectCollection_, CollectionEvents.ADDED, this.onProjectAdded_);
    this.onRouteChanged_();
  }

  /**
   * @override
   */
  async onInserted(element: HTMLElement): Promise<void> {
    super.onInserted(element);
    const projects = await this.projectCollection_.list();
    const projectIds = Arrays.of(projects)
        .map((project: Project) => {
          return project.getId();
        })
        .asArray();
    this.projectCollectionHook_.set(projectIds);
  }
}
