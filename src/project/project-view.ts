import {bind, customElement, DomBridge} from 'external/gs_tools/src/webc';
import {inject} from 'external/gs_tools/src/inject';

import {BaseThemedElement} from 'external/gs_ui/src/common';
import {ThemeService} from 'external/gs_ui/src/theming';

import {FilterButton} from '../common/filter-button';
import {Project} from '../data/project';
import {ProjectCollection} from '../data/project-collection';
import {RouteService} from '../routing/route-service';
import {RouteServiceEvents} from '../routing/route-service-events';
import {Routes} from '../routing/routes';


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
  private readonly routeService_: RouteService;

  @bind('#projectName').innerText()
  private readonly projectNameTextBridge_: DomBridge<string>;

  constructor(
      @inject('pa.data.ProjectCollection') projectCollection: ProjectCollection,
      @inject('pa.routing.RouteService') routeService: RouteService,
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);
    this.projectCollection_ = projectCollection;
    this.projectNameTextBridge_ = DomBridge.of<string>();
    this.routeService_ = routeService;
  }

  /**
   * Updates the project name.
   */
  private updateProjectName_(): Promise<void> {
    let matches = this.routeService_.getMatches(Routes.PROJECT);
    if (matches !== null) {
      return this.projectCollection_
          .get(matches.projectId)
          .then((project: Project | null) => {
            if (project !== null) {
              this.projectNameTextBridge_.set(project.getName());
            }
          });
    }
    return Promise.resolve();
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
