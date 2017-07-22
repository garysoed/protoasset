import { DataAccess } from 'external/gs_tools/src/datamodel';
import { monad } from 'external/gs_tools/src/event';
import { inject } from 'external/gs_tools/src/inject';
import { StringParser } from 'external/gs_tools/src/parse';
import { customElement, dom, onDom } from 'external/gs_tools/src/webc';

import { BaseThemedElement2 } from 'external/gs_ui/src/common';
import { RouteService } from 'external/gs_ui/src/routing';
import { ThemeService } from 'external/gs_ui/src/theming';

import { Project } from '../data/project';
import { ProjectManager } from '../data/project-manager';
import { RouteFactoryService } from '../routing/route-factory-service';
import { Views } from '../routing/views';

const PROJECT_NAME_EL = '#projectName';
const PROJECT_ID_ATTR = {name: 'project-id', parser: StringParser, selector: null};

@customElement({
  tag: 'pa-project-item',
  templateKey: 'src/landing/project-item',
})
export class ProjectItem extends BaseThemedElement2 {
  private readonly routeFactoryService_: RouteFactoryService;
  private readonly routeService_: RouteService<Views>;

  constructor(
      @inject('pa.routing.RouteFactoryService') routeFactoryService: RouteFactoryService,
      @inject('gs.routing.RouteService') routeService: RouteService<Views>,
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);

    this.routeFactoryService_ = routeFactoryService;
    this.routeService_ = routeService;
  }

  @onDom.event(null, 'click')
  onElementClicked_(@dom.attribute(PROJECT_ID_ATTR) projectId: string | null): void {
    if (projectId !== null) {
      this.routeService_.goTo(this.routeFactoryService_.assetList(), {projectId: projectId});
    }
  }

  @onDom.attributeChange(PROJECT_ID_ATTR)
  async onProjectIdChanged_(
      @dom.element(PROJECT_NAME_EL) projectNameEl: HTMLElement,
      @dom.attribute(PROJECT_ID_ATTR) newId: string | null,
      @monad(ProjectManager.monad()) projectDataAccess: DataAccess<Project>): Promise<void> {
    const projectPromise: Promise<Project | null> =
        newId ? projectDataAccess.get(newId) : Promise.resolve(null);
    const project = await projectPromise;
    if (project !== null) {
      projectNameEl.innerText = project.getName();
    } else {
      projectNameEl.innerText = '';
    }
  }
}
