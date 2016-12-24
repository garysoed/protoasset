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

import {Asset} from '../data/asset';
import {AssetCollection} from '../data/asset-collection';
import {RouteFactoryService} from '../routing/route-factory-service';
import {Views} from '../routing/views';


/**
 * The main landing view of the app.
 */
@customElement({
  dependencies: [AssetCollection],
  tag: 'pa-create-asset-view',
  templateKey: 'src/project/create-asset-view',
})
export class CreateAssetView extends BaseThemedElement {
  @bind('gs-text-input').attribute('gs-value', StringParser)
  private readonly nameValueBridge_: DomBridge<string>;

  @bind('gs-basic-button#createButton').attribute('disabled', BooleanParser)
  private readonly createButtonDisabledBridge_: DomBridge<boolean>;

  private readonly assetCollection_: AssetCollection;
  private readonly routeFactoryService_: RouteFactoryService;
  private readonly routeService_: RouteService<Views>;

  /**
   * @param themeService
   * @param projectCollection
   */
  constructor(
      @inject('theming.ThemeService') themeService: ThemeService,
      @inject('pa.data.AssetCollection') assetCollection: AssetCollection,
      @inject('pa.routing.RouteFactoryService') routeFactoryService: RouteFactoryService,
      @inject('gs.routing.RouteService') routeService: RouteService<Views>) {
    super(themeService);
    this.createButtonDisabledBridge_ = DomBridge.of<boolean>(true);
    this.nameValueBridge_ = DomBridge.of<string>();
    this.assetCollection_ = assetCollection;
    this.routeFactoryService_ = routeFactoryService;
    this.routeService_ = routeService;
  }

  /**
   * @return Project ID of the view, or null if there is none.
   */
  private getProjectId_(): string | null {
    let params = this.routeService_.getParams(this.routeFactoryService_.project());
    return params === null ? null : params.projectId;
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
    let projectId = this.getProjectId_();
    if (projectId !== null) {
      this.reset_();
      this.routeService_.goTo(this.routeFactoryService_.project(), {projectId: projectId});
    }
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
    const assetName = this.nameValueBridge_.get();
    if (!assetName) {
      throw Validate.fail('Project name is not set');
    }

    const projectId = this.getProjectId_();
    if (projectId === null) {
      return Promise.resolve();
    }

    return this.assetCollection_
        .reserveId(projectId)
        .then((id: string) => {
          let asset = new Asset(id, projectId);
          asset.setName(assetName);
          return this.assetCollection_.update(asset);
        })
        .then(() => {
          this.reset_();
          this.routeService_
              .goTo(this.routeFactoryService_.project(), {projectId: projectId});
        });
  }
}
