import {bind, customElement, DomBridge, handle, StringParser} from 'external/gs_tools/src/webc';
import {inject} from 'external/gs_tools/src/inject';

import {BaseThemedElement} from 'external/gs_ui/src/common';
import {Event} from 'external/gs_ui/src/const';
import {ThemeService} from 'external/gs_ui/src/theming';

import {CollectionEvents} from '../data/collection-events';
import {FilterButton} from '../common/filter-button';
import {Project} from '../data/project';
import {ProjectCollection} from '../data/project-collection';
import {ProjectItem} from './project-item';
import {RouteService} from '../routing/route-service';
import {RouteServiceEvents} from '../routing/route-service-events';
import {Routes} from '../routing/routes';

/**
 * @param document The document to create the element in.
 * @return The newly created project item element.
 */
export function projectItemElGenerator(document: Document): Element {
  return document.createElement('pa-project-item');
}


/**
 * @param data The data to set on the given element.
 * @param element The element that the given data should be set to.
 */
export function projectItemElDataSetter(project: Project, element: Element): void {
  element.setAttribute('project-id', project.getId());
}


/**
 * The main landing view of the app.
 */
@customElement({
  dependencies: [FilterButton, ProjectCollection, ProjectItem, RouteService],
  tag: 'pa-landing-view',
  templateKey: 'src/landing/landing-view',
})
export class LandingView extends BaseThemedElement {
  @bind('#projects').childrenElements(projectItemElGenerator, projectItemElDataSetter)
  private readonly projectCollectionBridge_: DomBridge<Project[]>;

  private readonly routeService_: RouteService;
  private readonly projectCollection_: ProjectCollection;

  constructor(
      @inject('theming.ThemeService') themeService: ThemeService,
      @inject('pa.data.ProjectCollection') projectCollection: ProjectCollection,
      @inject('pa.routing.RouteService') routeService: RouteService) {
    super(themeService);
    this.routeService_ = routeService;
    this.projectCollection_ = projectCollection;
    this.projectCollectionBridge_ = DomBridge.of<Project[]>();
  }

  /**
   * Handles event when the location was changed.
   */
  private onRouteChanged_(): Promise<void> {
    if (this.routeService_.isDisplayed(Routes.LANDING)) {
      return this.projectCollection_
          .list()
          .then((projects: Project[]) => {
            if (projects.length === 0) {
              this.routeService_.goTo(Routes.CREATE_PROJECT.create());
            }
          });
    } else {
      return Promise.resolve();
    }
  }

  /**
   * Handles event when the create button is clicked.
   */
  @handle('#createButton').event(Event.ACTION)
  protected onCreateAction_(): void {
    this.routeService_.goTo(Routes.CREATE_PROJECT.create());
  }

  @handle('#filterButton').attributeChange('filter-text', StringParser)
  protected onFilterButtonTextAttrChange_(newValue: string | null): Promise<void> {
    let projectsPromise = (newValue === null || newValue === '')
        ? this.projectCollection_.list()
        : this.projectCollection_.search(newValue);

    return projectsPromise
        .then((projects: Project[]) => {
          this.projectCollectionBridge_.set(projects);
        });
  }

  /**
   * Handles when a project is added.
   * @param project The added project.
   */
  private onProjectAdded_(project: Project): void {
    let projects = this.projectCollectionBridge_.get() || [];
    projects.push(project);
    this.projectCollectionBridge_.set(projects);
  }

  /**
   * @override
   */
  onCreated(element: HTMLElement): void {
    super.onCreated(element);
    this.addDisposable(this.routeService_.on(
        RouteServiceEvents.CHANGED,
        this.onRouteChanged_,
        this));
    this.addDisposable(this.projectCollection_.on(
        CollectionEvents.ADDED,
        this.onProjectAdded_,
        this));
    this.onRouteChanged_();
  }

  /**
   * @override
   */
  onInserted(element: HTMLElement): Promise<void> {
    super.onInserted(element);
    return this.projectCollection_
        .list()
        .then((projects: Project[]) => {
          this.projectCollectionBridge_.set(projects);
        });
  }
}
