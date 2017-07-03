import { ImmutableSet, Iterables } from 'external/gs_tools/src/immutable';
import { inject } from 'external/gs_tools/src/inject';
import {
  ChildElementDataHelper,
  customElement,
  DomHook,
  handle,
  hook } from 'external/gs_tools/src/webc';

import { BaseThemedElement } from 'external/gs_ui/src/common';
import { Event } from 'external/gs_ui/src/const';
import { RouteService, RouteServiceEvents } from 'external/gs_ui/src/routing';
import { ThemeService } from 'external/gs_ui/src/theming';

import { FilterButton } from '../common/filter-button';
import { Asset } from '../data/asset';
import { AssetCollection } from '../data/asset-collection';
import { ProjectCollection } from '../data/project-collection';
import { AssetItem } from '../project/asset-item';
import { RouteFactoryService } from '../routing/route-factory-service';
import { Views } from '../routing/views';


type AssetItemData = {assetId: string, projectId: string};


export const ASSET_DATA_HELPER: ChildElementDataHelper<AssetItemData> = {
  /**
   * @override
   */
  create(document: Document): Element {
    return document.createElement('pa-asset-item');
  },

  /**
   * @override
   */
  get(element: Element): AssetItemData | null {
    const assetId = element.getAttribute('gs-asset-id');
    const projectId = element.getAttribute('gs-project-id');
    if (assetId === null || projectId === null) {
      return null;
    }

    return {assetId, projectId};
  },

  /**
   * @override
   */
  set(data: AssetItemData, element: Element): void {
    element.setAttribute('gs-asset-id', data.assetId);
    element.setAttribute('gs-project-id', data.projectId);
  },
};


/**
 * The main landing view of the app.
 */
@customElement({
  dependencies: ImmutableSet.of([
    AssetCollection, AssetItem, FilterButton, ProjectCollection, RouteService,
  ]),
  tag: 'pa-asset-list-view',
  templateKey: 'src/project/asset-list-view',
})
export class AssetListView extends BaseThemedElement {
  private readonly assetCollection_: AssetCollection;

  @hook('#assets').childrenElements<AssetItemData>(ASSET_DATA_HELPER)
  private readonly assetsHook_: DomHook<AssetItemData[]>;
  private readonly projectCollection_: ProjectCollection;

  @hook('#projectName').innerText()
  private readonly projectNameTextHook_: DomHook<string>;
  private readonly routeFactoryService_: RouteFactoryService;
  private readonly routeService_: RouteService<Views>;


  constructor(
      @inject('pa.data.AssetCollection') assetCollection: AssetCollection,
      @inject('pa.data.ProjectCollection') projectCollection: ProjectCollection,
      @inject('pa.routing.RouteFactoryService') routeFactoryService: RouteFactoryService,
      @inject('gs.routing.RouteService') routeService: RouteService<Views>,
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);
    this.assetCollection_ = assetCollection;
    this.assetsHook_ = DomHook.of<AssetItemData[]>();
    this.projectCollection_ = projectCollection;
    this.projectNameTextHook_ = DomHook.of<string>();
    this.routeFactoryService_ = routeFactoryService;
    this.routeService_ = routeService;
  }

  /**
   * @return The project ID of the view, or null if the view has no project IDs.
   */
  private getProjectId_(): null | string {
    const params = this.routeService_.getParams(this.routeFactoryService_.assetList());
    return params === null ? null : params.projectId;
  }

  @handle('#createButton').event(Event.ACTION)
  onCreateButtonClicked_(): void {
    const projectId = this.getProjectId_();
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
    this.onProjectIdChanged_();
    this.addDisposable(
        this.routeService_.on(RouteServiceEvents.CHANGED, this.onProjectIdChanged_, this));
  }

  /**
   * Updates the project name.
   */
  private async onProjectIdChanged_(): Promise<void> {
    const projectId = this.getProjectId_();
    if (projectId === null) {
      return;
    }

    const [assets, project] = await Promise.all([
      this.assetCollection_.list(projectId),
      this.projectCollection_.get(projectId),
    ]);

    const assetItemData = Iterables.toArray(assets
        .mapItem((asset: Asset) => {
          return {assetId: asset.getId(), projectId: asset.getProjectId()};
        }));

    this.assetsHook_.set(assetItemData);
    if (project !== null) {
      this.projectNameTextHook_.set(project.getName());
    }
  }

  @handle('#settingsButton').event(Event.ACTION)
  onSettingsButtonClicked_(): void {
    const projectId = this.getProjectId_();
    if (projectId !== null) {
      this.routeService_.goTo(
          this.routeFactoryService_.projectSettings(), {projectId: projectId});
    }
  }
}
// TODO: Mutable
