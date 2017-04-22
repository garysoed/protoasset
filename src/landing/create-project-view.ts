import { inject } from 'external/gs_tools/src/inject';
import { BooleanParser, StringParser } from 'external/gs_tools/src/parse';
import {
    customElement,
    DomHook,
    handle,
    hook } from 'external/gs_tools/src/webc';

import { BaseThemedElement } from 'external/gs_ui/src/common';
import { Event } from 'external/gs_ui/src/const';
import { RouteService } from 'external/gs_ui/src/routing';
import { ThemeService } from 'external/gs_ui/src/theming';

import { Validate } from 'external/gs_tools/src/valid';

import { Project } from '../data/project';
import { ProjectCollection } from '../data/project-collection';
import { Editor } from '../project/editor';
import { RouteFactoryService } from '../routing/route-factory-service';
import { Views } from '../routing/views';


/**
 * The main landing view of the app.
 */
@customElement({
  dependencies: [Editor],
  tag: 'pa-create-project-view',
  templateKey: 'src/landing/create-project-view',
})
export class CreateProjectView extends BaseThemedElement {
  @hook('#editor').attribute('project-name', StringParser)
  private readonly nameValueHook_: DomHook<string>;

  @hook('gs-basic-button#createButton').attribute('disabled', BooleanParser)
  private readonly createButtonDisabledHook_: DomHook<boolean>;

  private readonly projectCollection_: ProjectCollection;
  private readonly routeFactoryService_: RouteFactoryService;
  private readonly routeService_: RouteService<Views>;

  /**
   * @param themeService
   * @param projectCollection
   */
  constructor(
      @inject('theming.ThemeService') themeService: ThemeService,
      @inject('pa.data.ProjectCollection') projectCollection: ProjectCollection,
      @inject('pa.routing.RouteFactoryService') routeFactoryService: RouteFactoryService,
      @inject('gs.routing.RouteService') routeService: RouteService<Views>) {
    super(themeService);
    this.createButtonDisabledHook_ = DomHook.of<boolean>(true);
    this.nameValueHook_ = DomHook.of<string>();
    this.projectCollection_ = projectCollection;
    this.routeFactoryService_ = routeFactoryService;
    this.routeService_ = routeService;
  }

  /**
   * Resets the form.
   */
  private reset_(): void {
    this.nameValueHook_.set('');
  }

  /**
   * Handles event when the cancel button is clicked.
   */
  @handle('#cancelButton').event(Event.ACTION)
  protected onCancelAction_(): void {
    this.reset_();
    this.routeService_.goTo(this.routeFactoryService_.landing(), {});
  }

  /**
   * Handles event when the name field has changed.
   */
  @handle('#editor').attributeChange('project-name')
  protected onNameChange_(): void {
    this.createButtonDisabledHook_.set(!this.nameValueHook_.get());
  }

  /**
   * Handles event when the submit button is clicked.
   *
   * @return Promise that will be resolved when all handling logic have completed.
   */
  @handle('#createButton').event(Event.ACTION)
  protected async onSubmitAction_(): Promise<void> {
    let projectName = this.nameValueHook_.get();
    if (projectName === null) {
      Validate.fail('Project name is not set');
    }

    let id = await this.projectCollection_.reserveId();
    let project = new Project(id);
    project.setName(projectName!);
    await this.projectCollection_.update(project),

    this.reset_();
    this.routeService_.goTo(this.routeFactoryService_.assetList(), {projectId: id});
  }
}
