import { atomic } from 'external/gs_tools/src/async';
import { DisposableFunction } from 'external/gs_tools/src/dispose';
import { DomEvent } from 'external/gs_tools/src/event';
import { inject } from 'external/gs_tools/src/inject';
import { StringParser } from 'external/gs_tools/src/parse';
import { customElement, DomHook, handle, hook } from 'external/gs_tools/src/webc';

import { BaseThemedElement } from 'external/gs_ui/src/common';
import { RouteService } from 'external/gs_ui/src/routing';
import { ThemeService } from 'external/gs_ui/src/theming';
import { OverlayService } from 'external/gs_ui/src/tool';

import { Asset } from '../data/asset';
import { AssetCollection } from '../data/asset-collection';
import { DataEvents } from '../data/data-events';
import { Helper } from '../data/helper';
import { RouteFactoryService } from '../routing/route-factory-service';
import { Views } from '../routing/views';


/**
 * Represents a helper item.
 */
@customElement({
  tag: 'pa-asset-helper-item',
  templateKey: 'src/asset/helper-item',
})
export class HelperItem extends BaseThemedElement {
  @hook(null).attribute('asset-id', StringParser)
  readonly assetIdHook_: DomHook<string>;

  @hook(null).attribute('helper-id', StringParser)
  readonly helperIdHook_: DomHook<string>;

  @hook('#name').innerText()
  readonly nameHook_: DomHook<string>;

  @hook('#nameInput').attribute('gs-value', StringParser)
  readonly nameInputHook_: DomHook<string>;

  @hook(null).attribute('project-id', StringParser)
  readonly projectIdHook_: DomHook<string>;

  @hook('#root').attribute('gs-value', StringParser)
  readonly rootValueHook_: DomHook<string>;

  private readonly assetCollection_: AssetCollection;
  private helperUpdateDeregister_: DisposableFunction | null;
  private readonly overlayService_: OverlayService;
  private readonly routeFactoryService_: RouteFactoryService;
  private readonly routeService_: RouteService<Views>;

  constructor(
      @inject('pa.data.AssetCollection') assetCollection: AssetCollection,
      @inject('gs.tool.OverlayService') overlayService: OverlayService,
      @inject('pa.routing.RouteFactoryService') routeFactoryService: RouteFactoryService,
      @inject('gs.routing.RouteService') routeService: RouteService<Views>,
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);
    this.assetCollection_ = assetCollection;
    this.assetIdHook_ = DomHook.of<string>();
    this.helperUpdateDeregister_ = null;
    this.helperIdHook_ = DomHook.of<string>();
    this.nameHook_ = DomHook.of<string>();
    this.nameInputHook_ = DomHook.of<string>();
    this.overlayService_ = overlayService;
    this.projectIdHook_ = DomHook.of<string>();
    this.rootValueHook_ =  DomHook.of<string>();
    this.routeFactoryService_ = routeFactoryService;
    this.routeService_ = routeService;
  }

  /**
   * @override
   */
  disposeInternal(): void {
    if (this.helperUpdateDeregister_ !== null) {
      this.helperUpdateDeregister_.dispose();
    }
    super.disposeInternal();
  }

  /**
   * @return Promise that will be resolved with the asset, or null if the asset cannot be found.
   */
  private getAsset_(): Promise<Asset | null> {
    const assetId = this.assetIdHook_.get();
    const projectId = this.projectIdHook_.get();

    if (assetId === null || projectId === null) {
      return Promise.resolve(null);
    }

    return this.assetCollection_.get(projectId, assetId);
  }

  /**
   * @return Promise that will be resolved with the helper, or null if the helper cannot be found.
   */
  private async getHelper_(): Promise<Helper | null> {
    const helperId = this.helperIdHook_.get();
    if (helperId === null) {
      return null;
    }

    const asset = await this.getAsset_();
    if (asset === null) {
      return null;
    }

    return asset.getHelper(helperId);
  }

  @handle('#cancel').event(DomEvent.CLICK)
  onCancelClick_(event: Event): void {
    event.stopPropagation();
    this.rootValueHook_.set('read');
  }

  /**
   * @override
   */
  onCreated(element: HTMLElement): void {
    super.onCreated(element);
    this.updateHelper_();
  }

  @handle('#delete').event(DomEvent.CLICK)
  async onDeleteClick_(event: Event): Promise<void> {
    event.stopPropagation();
    const [asset, helper] = await Promise.all([this.getAsset_(), this.getHelper_()]);
    if (asset === null || helper === null) {
      return;
    }

    asset.deleteHelper(helper.getId());

    this.updateHelper_();
    this.assetCollection_.update(asset);
  }

  @handle('#edit').event(DomEvent.CLICK)
  async onEditClick_(event: Event): Promise<void> {
    event.stopPropagation();
    const helper = await this.getHelper_();
    if (helper !== null) {
      this.nameInputHook_.set(helper.getName());
    } else {
      this.nameInputHook_.delete();
    }
    this.rootValueHook_.set('edit');
  }

  /**
   * Handles when the helper is updated.
   * @param helper The updated helper.
   */
  private onHelperUpdated_(helper: Helper): void {
    this.nameHook_.set(helper.getName());
  }

  @handle('#ok').event(DomEvent.CLICK)
  async onOkClick_(event: Event): Promise<void> {
    event.stopPropagation();

    const helperId = this.helperIdHook_.get();
    if (helperId === null) {
      return Promise.resolve();
    }

    const asset = await this.getAsset_();
    if (asset === null) {
      return;
    }

    const helper = asset.getHelper(helperId);
    if (helper === null) {
      return;
    }

    helper.setName(this.nameInputHook_.get() || '');

    this.rootValueHook_.set('read');

    this.assetCollection_.update(asset);
  }

  @handle('#readRoot').event(DomEvent.CLICK)
  async onReadRootClick_(): Promise<void> {
    const [asset, helper] = await Promise.all([this.getAsset_(), this.getHelper_()]);
    if (asset === null || helper === null) {
      return;
    }

    const monad = this.routeService_.monad();
    const navigator = monad.get();
    monad.set(navigator.goTo(this.routeFactoryService_.helper(), {
      assetId: asset.getId(),
      helperId: helper.getId(),
      projectId: asset.getProjectId(),
    }));

    // TODO: FIX THIS
    this.overlayService_.hideOverlay(Symbol('FIX THIS'));
  }

  @handle(null).attributeChange('asset-id')
  @handle(null).attributeChange('helper-id')
  @handle(null).attributeChange('project-id')
  @atomic()
  async updateHelper_(): Promise<void> {
    const helper = await this.getHelper_();
    if (this.helperUpdateDeregister_ !== null) {
      this.helperUpdateDeregister_.dispose();
      this.helperUpdateDeregister_ = null;
    }

    if (helper === null) {
      return;
    }

    this.helperUpdateDeregister_ = this.listenTo(
        helper, DataEvents.CHANGED, this.onHelperUpdated_.bind(this, helper));
    this.onHelperUpdated_(helper);
  }
}
// TODO: Mutable
