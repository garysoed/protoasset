import { DomEvent } from 'external/gs_tools/src/event';
import { inject } from 'external/gs_tools/src/inject';
import { StringParser } from 'external/gs_tools/src/parse';
import { customElement, DomHook, handle, hook } from 'external/gs_tools/src/webc';

import { BaseThemedElement } from 'external/gs_ui/src/common';
import { RouteService } from 'external/gs_ui/src/routing';
import { ThemeService } from 'external/gs_ui/src/theming';

import { ProjectCollection } from '../data/project-collection';
import { RouteFactoryService } from '../routing/route-factory-service';
import { Views } from '../routing/views';


@customElement({
  tag: 'pa-project-item',
  templateKey: 'src/landing/project-item',
})
export class ProjectItem extends BaseThemedElement {
  private readonly projectCollection_: ProjectCollection;

  @hook(null).attribute('project-id', StringParser)
  private readonly projectIdHook_: DomHook<string>;

  @hook('#projectName').innerText()
  private readonly projectNameHook_: DomHook<string>;
  private readonly routeFactoryService_: RouteFactoryService;
  private readonly routeService_: RouteService<Views>;

  constructor(
      @inject('pa.data.ProjectCollection') projectCollection: ProjectCollection,
      @inject('pa.routing.RouteFactoryService') routeFactoryService: RouteFactoryService,
      @inject('gs.routing.RouteService') routeService: RouteService<Views>,
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);

    this.projectCollection_ = projectCollection;
    this.projectIdHook_ = DomHook.of<string>();
    this.projectNameHook_ = DomHook.of<string>();
    this.routeFactoryService_ = routeFactoryService;
    this.routeService_ = routeService;
  }

  @handle(null).event(DomEvent.CLICK)
  protected onElementClicked_(): void {
    const projectId = this.projectIdHook_.get();
    if (projectId !== null) {
      this.routeService_.goTo(this.routeFactoryService_.assetList(), {projectId: projectId});
    }
  }

  @handle(null).attributeChange('project-id')
  protected async onProjectIdChanged_(newId: string): Promise<void> {
    const project = await this.projectCollection_.get(newId);
    if (project !== null) {
      this.projectNameHook_.set(project.getName());
    } else {
      this.projectNameHook_.delete();
    }
  }
}
// TODO: Mutable
