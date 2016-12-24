import {inject} from 'external/gs_tools/src/inject';
import {
    bind,
    BooleanParser,
    customElement,
    DomBridge,
    handle,
    StringParser} from 'external/gs_tools/src/webc';

import {BaseThemedElement} from 'external/gs_ui/src/common';
import {Event} from 'external/gs_ui/src/const';
import {RouteService} from 'external/gs_ui/src/routing';
import {ThemeService} from 'external/gs_ui/src/theming';

import {Validate} from 'external/gs_tools/src/valid';

import {Project} from '../data/project';
import {ProjectCollection} from '../data/project-collection';
import {RouteFactoryService} from '../routing/route-factory-service';
import {Views} from '../routing/views';


/**
 * The main landing view of the app.
 */
@customElement({
  tag: 'pa-create-project-view',
  templateKey: 'src/landing/create-project-view',
})
export class CreateProjectView extends BaseThemedElement {
  @bind('gs-text-input').attribute('gs-value', StringParser)
  private readonly nameValueBridge_: DomBridge<string>;

  @bind('gs-basic-button#createButton').attribute('disabled', BooleanParser)
  private readonly createButtonDisabledBridge_: DomBridge<boolean>;

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
    this.createButtonDisabledBridge_ = DomBridge.of<boolean>(true);
    this.nameValueBridge_ = DomBridge.of<string>();
    this.projectCollection_ = projectCollection;
    this.routeFactoryService_ = routeFactoryService;
    this.routeService_ = routeService;
  }

  /**
   * Resets the form.
   */
  private reset_(): void {
    this.nameValueBridge_.set('');
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
  @handle('gs-text-input').attributeChange('gs-value', StringParser)
  protected onNameChange_(): void {
    this.createButtonDisabledBridge_.set(!this.nameValueBridge_.get());
  }

  /**
   * Handles event when the submit button is clicked.
   *
   * @return Promise that will be resolved when all handling logic have completed.
   */
  @handle('#createButton').event(Event.ACTION)
  protected onSubmitAction_(): Promise<void> {
    let projectName = this.nameValueBridge_.get();
    if (projectName === null) {
      Validate.fail('Project name is not set');
    }

    return this.projectCollection_
        .reserveId()
        .then((id: string) => {
          let project = new Project(id);
          project.setName(projectName!);
          return this.projectCollection_.update(project);
        })
        .then(() => {
          this.reset_();
          this.routeService_.goTo(this.routeFactoryService_.landing(), {});
        });
  }
}
