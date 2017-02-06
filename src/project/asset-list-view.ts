import {inject} from 'external/gs_tools/src/inject';
import {bind, customElement, DomHook, handle} from 'external/gs_tools/src/webc';

import {BaseThemedElement} from 'external/gs_ui/src/common';
import {Event} from 'external/gs_ui/src/const';
import {RouteService, RouteServiceEvents} from 'external/gs_ui/src/routing';
import {ThemeService} from 'external/gs_ui/src/theming';

import {FilterButton} from '../common/filter-button';
import {Asset} from '../data/asset';
import {AssetCollection} from '../data/asset-collection';
import {ProjectCollection} from '../data/project-collection';
import {RouteFactoryService} from '../routing/route-factory-service';
import {Views} from '../routing/views';

import {AssetItem} from './asset-item';


export function assetsGenerator(document: Document): Element {
  return document.createElement('pa-asset-item');
}

export function assetsDataSetter(asset: Asset, element: Element): void {
  element.setAttribute('gs-asset-id', asset.getId());
  element.setAttribute('gs-project-id', asset.getProjectId());
}

/**
 * The main landing view of the app.
 */
@customElement({
  dependencies: [AssetCollection, AssetItem, FilterButton, ProjectCollection, RouteService],
  tag: 'pa-asset-list-view',
  templateKey: 'src/project/asset-list-view',
})
export class AssetListView extends BaseThemedElement {
  @bind('#assets').childrenElements<Asset>(assetsGenerator, assetsDataSetter)
  private readonly assetsHook_: DomHook<Asset[]>;

  @bind('#projectName').innerText()
  private readonly projectNameTextHook_: DomHook<string>;

  private readonly assetCollection_: AssetCollection;
  private readonly projectCollection_: ProjectCollection;
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
    this.assetsHook_ = DomHook.of<Asset[]>();
    this.projectCollection_ = projectCollection;
    this.projectNameTextHook_ = DomHook.of<string>();
    this.routeFactoryService_ = routeFactoryService;
    this.routeService_ = routeService;
  }

  /**
   * @return The project ID of the view, or null if the view has no project IDs.
   */
  private getProjectId_(): null | string {
    let params = this.routeService_.getParams(this.routeFactoryService_.assetList());
    return params === null ? null : params.projectId;
  }

  /**
   * Updates the project name.
   */
  private async onProjectIdChanged_(): Promise<void> {
    let projectId = this.getProjectId_();
    if (projectId === null) {
      return;
    }

    let [assets, project] = await Promise.all([
      this.assetCollection_.list(projectId),
      this.projectCollection_.get(projectId),
    ]);

    this.assetsHook_.set(assets);
    if (project !== null) {
      this.projectNameTextHook_.set(project.getName());
    }
  }

  @handle('#createButton').event(Event.ACTION)
  protected onCreateButtonClicked_(): void {
    let projectId = this.getProjectId_();
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
    this.addDisposable(this.routeService_.on(
        RouteServiceEvents.CHANGED,
        this.onProjectIdChanged_,
        this));
  }
}
