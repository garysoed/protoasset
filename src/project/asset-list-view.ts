import { DataAccess } from 'external/gs_tools/src/datamodel';
import { monad, monadOut, on } from 'external/gs_tools/src/event';
import { ImmutableList, ImmutableSet } from 'external/gs_tools/src/immutable';
import { inject } from 'external/gs_tools/src/inject';
import { ChildElementsSelector, MonadValue } from 'external/gs_tools/src/interfaces';
import { MonadSetter } from 'external/gs_tools/src/interfaces/monad-setter';
import { StringParser } from 'external/gs_tools/src/parse';
import {
  customElement,
  domOut,
  onDom,
  onLifecycle} from 'external/gs_tools/src/webc';

import { BaseThemedElement2 } from 'external/gs_ui/src/common';
import { RouteServiceEvents } from 'external/gs_ui/src/const';
import { RouteNavigator, RouteService } from 'external/gs_ui/src/routing';
import { ThemeService } from 'external/gs_ui/src/theming';

import { FilterButton } from '../common/filter-button';
import { AssetCollection } from '../data/asset-collection';
import { Project } from '../data/project';
import { ProjectManager } from '../data/project-manager';
import { AssetItem } from '../project/asset-item';
import { RouteFactoryService } from '../routing/route-factory-service';
import { Views } from '../routing/views';


export type AssetItemData = {assetId: string, projectId: string};

const ASSET_LIST_EL = '#assets';
const CREATE_BUTTON_EL = '#createButton';
const PROJECT_NAME_EL = '#projectName';
const SETTINGS_BUTTON_EL = '#settingsButton';

const PROJECT_NAME_INNER_TEXT = {parser: StringParser, selector: PROJECT_NAME_EL};

export const ASSET_ITEM_CHILDREN: ChildElementsSelector<AssetItemData> = {
  bridge: {
    create(document: Document): Element {
      return document.createElement('pa-asset-item');
    },

    get(element: Element): AssetItemData | null {
      const assetId = element.getAttribute('asset-id');
      const projectId = element.getAttribute('project-id');
      if (!assetId || !projectId) {
        return null;
      }

      return {assetId, projectId};
    },

    set(data: AssetItemData, element: Element): void {
      element.setAttribute('asset-id', data.assetId);
      element.setAttribute('project-id', data.projectId);
    },
  },

  selector: ASSET_LIST_EL,
};


/**
 * The main landing view of the app.
 */
@customElement({
  dependencies: ImmutableSet.of([
    AssetCollection, AssetItem, FilterButton, RouteService,
  ]),
  tag: 'pa-asset-list-view',
  templateKey: 'src/project/asset-list-view',
})
export class AssetListView extends BaseThemedElement2 {
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

  /**
   * @return The project ID of the view, or null if the view has no project IDs.
   */
  private getProjectId_(routeNavigator: RouteNavigator<Views>): null | string {
    const route = routeNavigator.getRoute(this.routeFactoryService_.assetList());
    return route === null ? null : route.params.projectId;
  }

  @onDom.event(CREATE_BUTTON_EL, 'gs-action')
  onCreateButtonClicked_(
      @monadOut((view: AssetListView) => view.routeService_.monad())
          routeSetter: MonadSetter<RouteNavigator<Views>>): MonadValue<any>[] {
    const projectId = this.getProjectId_(routeSetter.value);
    if (!projectId) {
      return [];
    }

    return [
      routeSetter.set(routeSetter.value.goTo(
        this.routeFactoryService_.createAsset(), {projectId: projectId},
      )),
    ];
  }

  /**
   * Updates the project name.
   */
  @onLifecycle('create')
  @on((instance: AssetListView) => instance.routeService_, RouteServiceEvents.CHANGED)
  async onProjectIdChanged_(
      @domOut.childElements(ASSET_ITEM_CHILDREN)
          assetItemListSetter: MonadSetter<ImmutableList<AssetItemData>>,
      @domOut.innerText(PROJECT_NAME_INNER_TEXT) projectNameSetter: MonadSetter<string | null>,
      @monad(ProjectManager.monad()) projectAccess: DataAccess<Project>,
      @monad((view: AssetListView) => view.routeService_.monad())
          routeNavigator: RouteNavigator<Views>):
      Promise<Iterable<MonadValue<any>>> {
    const projectId = this.getProjectId_(routeNavigator);
    if (projectId === null) {
      return [];
    }

    const project = await projectAccess.get(projectId);
    if (project === null) {
      return [];
    }

    return [
      projectNameSetter.set(project.getName()),
      assetItemListSetter.set(ImmutableList.of(
        project.getAssets().mapItem((assetId: string) => {
          return {assetId: assetId, projectId};
        }))),
    ];
  }

  @onDom.event(SETTINGS_BUTTON_EL, 'gs-action')
  onSettingsButtonClicked_(
      @monadOut((view: AssetListView) => view.routeService_.monad())
          routeSetter: MonadSetter<RouteNavigator<Views>>): MonadValue<any>[] {
    const projectId = this.getProjectId_(routeSetter.value);
    if (!projectId) {
      return [];
    }

    return [
      routeSetter.set(routeSetter.value.goTo(
          this.routeFactoryService_.projectSettings(), {projectId})),
    ];
  }
}
