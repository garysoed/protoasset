import {bind, customElement, DomBridge, handle} from 'external/gs_tools/src/webc';
import {inject} from 'external/gs_tools/src/inject';

import {BaseThemedElement} from 'external/gs_ui/src/common';
import {Event} from 'external/gs_ui/src/const';
import {RouteService, RouteServiceEvents} from 'external/gs_ui/src/routing';
import {ThemeService} from 'external/gs_ui/src/theming';

import {FilterButton} from '../common/filter-button';
import {Project} from '../data/project';
import {ProjectCollection} from '../data/project-collection';
import {RouteFactoryService} from '../routing/route-factory-service';
import {Views} from '../routing/views';


/**
 * The main landing view of the app.
 */
@customElement({
  dependencies: [FilterButton, ProjectCollection, RouteService],
  tag: 'pa-project-view',
  templateKey: 'src/project/project-view',
})
export class ProjectView extends BaseThemedElement {
  private readonly projectCollection_: ProjectCollection;
  private readonly routeFactoryService_: RouteFactoryService;
  private readonly routeService_: RouteService<Views>;

  @bind('#projectName').innerText()
  private readonly projectNameTextBridge_: DomBridge<string>;

  constructor(
      @inject('pa.data.ProjectCollection') projectCollection: ProjectCollection,
      @inject('pa.routing.RouteFactoryService') routeFactoryService: RouteFactoryService,
      @inject('gs.routing.RouteService') routeService: RouteService<Views>,
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);
    this.projectCollection_ = projectCollection;
    this.projectNameTextBridge_ = DomBridge.of<string>();
    this.routeFactoryService_ = routeFactoryService;
    this.routeService_ = routeService;
  }

  /**
   * @return The project ID of the view, or null if the view has no project IDs.
   */
  private getProjectId_(): null | string {
    let params = this.routeService_.getParams(this.routeFactoryService_.project());
    return params === null ? null : params.projectId;
  }

  /**
   * Updates the project name.
   */
  private updateProjectName_(): Promise<void> {
    let projectId = this.getProjectId_();
    if (projectId !== null) {
      return this.projectCollection_
          .get(projectId)
          .then((project: Project | null) => {
            if (project !== null) {
              this.projectNameTextBridge_.set(project.getName());
            }
          });
    }
    return Promise.resolve();
  }

  @handle('#createButton').event(Event.ACTION)
  protected onCreateButtonClicked_(): void {
    let projectId = this.getProjectId_();
    if (projectId !== null) {
      this.routeService_.goTo(
          this.routeFactoryService_.createAsset(), {projectId: projectId});
    }
  }

  /**
   * @override
   */
  onCreated(element: HTMLElement): void {
    super.onCreated(element);
    this.updateProjectName_();
    this.addDisposable(this.routeService_.on(
        RouteServiceEvents.CHANGED,
        this.updateProjectName_,
        this));
  }
}
