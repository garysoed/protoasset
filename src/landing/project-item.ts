import {bind, customElement, DomBridge, handle, StringParser} from 'external/gs_tools/src/webc';
import {DomEvent} from 'external/gs_tools/src/event';
import {inject} from 'external/gs_tools/src/inject';

import {BaseThemedElement} from 'external/gs_ui/src/common';
import {RouteService} from 'external/gs_ui/src/routing';
import {ThemeService} from 'external/gs_ui/src/theming';

import {Project} from '../data/project';
import {ProjectCollection} from '../data/project-collection';
import {RouteFactoryService} from '../routing/route-factory-service';
import {Views} from '../routing/views';


@customElement({
  tag: 'pa-project-item',
  templateKey: 'src/landing/project-item',
})
export class ProjectItem extends BaseThemedElement {
  private readonly projectCollection_: ProjectCollection;
  private readonly routeFactoryService_: RouteFactoryService;
  private readonly routeService_: RouteService<Views>;

  @bind(null).attribute('project-id', StringParser)
  private readonly projectIdBridge_: DomBridge<string>;

  @bind('#projectName').innerText()
  private readonly projectNameBridge_: DomBridge<string>;


  constructor(
      @inject('pa.data.ProjectCollection') projectCollection: ProjectCollection,
      @inject('pa.routing.RouteFactoryService') routeFactoryService: RouteFactoryService,
      @inject('gs.routing.RouteService') routeService: RouteService<Views>,
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);

    this.projectCollection_ = projectCollection;
    this.projectIdBridge_ = DomBridge.of<string>();
    this.projectNameBridge_ = DomBridge.of<string>();
    this.routeFactoryService_ = routeFactoryService;
    this.routeService_ = routeService;
  }

  @handle(null).event(DomEvent.CLICK)
  protected onElementClicked_(): void {
    let projectId = this.projectIdBridge_.get();
    if (projectId !== null) {
      this.routeService_.goTo(this.routeFactoryService_.project(), {projectId: projectId});
    }
  }

  @handle(null).attributeChange('project-id', StringParser)
  protected onProjectIdChanged_(newId: string): Promise<void> {
    return this.projectCollection_
        .get(newId)
        .then((project: Project | null) => {
          if (project !== null) {
            this.projectNameBridge_.set(project.getName());
          } else {
            this.projectNameBridge_.delete();
          }
        });
  }
}
