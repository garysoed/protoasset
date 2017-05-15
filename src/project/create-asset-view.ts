import { ImmutableSet } from 'external/gs_tools/src/immutable';
import { inject } from 'external/gs_tools/src/inject';
import { BooleanParser, EnumParser, FloatParser, StringParser } from 'external/gs_tools/src/parse';
import {
    customElement,
    DomHook,
    handle,
    hook } from 'external/gs_tools/src/webc';

import { BaseThemedElement } from 'external/gs_ui/src/common';
import { Event } from 'external/gs_ui/src/const';
import { RouteService } from 'external/gs_ui/src/routing';
import { ThemeService } from 'external/gs_ui/src/theming';

import { Editor } from '../asset/editor';
import { Asset, AssetType } from '../data/asset';
import { AssetCollection } from '../data/asset-collection';
import { RouteFactoryService } from '../routing/route-factory-service';
import { Views } from '../routing/views';


/**
 * The main landing view of the app.
 */
@customElement({
  dependencies: ImmutableSet.of([AssetCollection, Editor]),
  tag: 'pa-create-asset-view',
  templateKey: 'src/project/create-asset-view',
})
export class CreateAssetView extends BaseThemedElement {
  @hook('#assetEditor').attribute('asset-type', EnumParser(AssetType))
  readonly assetTypeHook_: DomHook<AssetType>;

  @hook('#createButton').attribute('disabled', BooleanParser)
  readonly createButtonDisabledHook_: DomHook<boolean>;

  @hook('#assetEditor').attribute('asset-height', FloatParser)
  readonly heightHook_: DomHook<number>;

  @hook('#assetEditor').attribute('asset-name', StringParser)
  readonly nameHook_: DomHook<string>;

  @hook('#assetEditor').attribute('asset-width', FloatParser)
  readonly widthHook_: DomHook<number>;

  private readonly assetCollection_: AssetCollection;
  private readonly routeFactoryService_: RouteFactoryService;
  private readonly routeService_: RouteService<Views>;

  /**
   * @param themeService
   * @param projectCollection
   */
  constructor(
      @inject('pa.data.AssetCollection') assetCollection: AssetCollection,
      @inject('pa.routing.RouteFactoryService') routeFactoryService: RouteFactoryService,
      @inject('gs.routing.RouteService') routeService: RouteService<Views>,
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);
    this.assetCollection_ = assetCollection;
    this.assetTypeHook_ = DomHook.of<AssetType>();
    this.createButtonDisabledHook_ = DomHook.of<boolean>(true);
    this.nameHook_ = DomHook.of<string>();
    this.routeFactoryService_ = routeFactoryService;
    this.routeService_ = routeService;
    this.heightHook_ = DomHook.of<number>();
    this.widthHook_ = DomHook.of<number>();
  }

  /**
   * @return Project ID of the view, or null if there is none.
   */
  private getProjectId_(): string | null {
    const params = this.routeService_.getParams(this.routeFactoryService_.createAsset());
    return params === null ? null : params.projectId;
  }

  /**
   * Handles event when the cancel button is clicked.
   */
  @handle('#cancelButton').event(Event.ACTION)
  protected onCancelAction_(): void {
    const projectId = this.getProjectId_();
    if (projectId !== null) {
      this.reset_();
      this.routeService_.goTo(this.routeFactoryService_.assetList(), {projectId: projectId});
    }
  }

  /**
   * @override
   */
  onCreated(element: HTMLElement): void {
    super.onCreated(element);
    this.reset_();
  }

  /**
   * Handles event when the submit button is clicked.
   *
   * @return Promise that will be resolved when all handling logic have completed.
   */
  @handle('#createButton').event(Event.ACTION)
  async onSubmitAction_(): Promise<void> {
    const assetName = this.nameHook_.get();
    if (!assetName) {
      throw new Error('Project name is not set');
    }

    const assetType = this.assetTypeHook_.get();
    if (assetType === null) {
      throw new Error('Asset type is not set');
    }

    const height = this.heightHook_.get();
    if (height === null || Number.isNaN(height)) {
      throw new Error('Asset height is not set');
    }

    const width = this.widthHook_.get();
    if (width === null || Number.isNaN(width)) {
      throw new Error('Asset width is not set');
    }

    const projectId = this.getProjectId_();
    if (projectId === null) {
      return Promise.resolve();
    }

    const id = await this.assetCollection_.reserveId(projectId);
    const asset = new Asset(id, projectId);
    asset.setName(assetName);
    asset.setType(assetType);
    asset.setHeight(height);
    asset.setWidth(width);
    await this.assetCollection_.update(asset);
    this.reset_();
    this.routeService_.goTo(this.routeFactoryService_.assetList(), {projectId: projectId});
  }

  /**
   * Resets the form.
   */
  private reset_(): void {
    this.assetTypeHook_.delete();
    this.nameHook_.delete();
    this.heightHook_.delete();
    this.widthHook_.delete();
  }

  /**
   * Verifies the input values.
   */
  @handle('#assetEditor').attributeChange('asset-type')
  @handle('#assetEditor').attributeChange('asset-name')
  @handle('#assetEditor').attributeChange('asset-height')
  @handle('#assetEditor').attributeChange('asset-width')
  verifyInput_(): void {
    this.createButtonDisabledHook_.set(
        !this.nameHook_.get()
        || this.assetTypeHook_.get() === null
        || Number.isNaN(this.widthHook_.get() || NaN)
        || Number.isNaN(this.heightHook_.get() || NaN));
  }
}
// TODO: Mutable
