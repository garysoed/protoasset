import { DataAccess } from 'external/gs_tools/src/datamodel';
import { monad, monadOut, MonadUtil } from 'external/gs_tools/src/event';
import { ImmutableList, ImmutableSet } from 'external/gs_tools/src/immutable';
import { inject } from 'external/gs_tools/src/inject';
import { MonadSetter, MonadValue } from 'external/gs_tools/src/interfaces';
import { BooleanParser, EnumParser, FloatParser, StringParser } from 'external/gs_tools/src/parse';
import { Log } from 'external/gs_tools/src/util';
import {
    customElement,
    dom,
    domOut,
    onDom,
    onLifecycle} from 'external/gs_tools/src/webc';

import { BaseThemedElement2 } from 'external/gs_ui/src/common';
import { RouteNavigator, RouteService } from 'external/gs_ui/src/routing';
import { ThemeService } from 'external/gs_ui/src/theming';

import { Editor } from '../asset/editor';
import { AssetCollection } from '../data/asset-collection';
import { AssetManager } from '../data/asset-manager';
import { Asset2, AssetType } from '../data/asset2';
import { Project } from '../data/project';
import { ProjectManager } from '../data/project-manager';
import { RouteFactoryService } from '../routing/route-factory-service';
import { Views } from '../routing/views';

const LOG = Log.of('protoasset.project.CreateAssetView');

const ASSET_EDITOR_EL = '#assetEditor';
const CANCEL_BUTTON_EL = '#cancelButton';
const CREATE_BUTTON_EL = '#createButton';

const ASSET_TYPE_ATTR = {
  name: 'asset-type',
  parser: EnumParser(AssetType),
  selector: ASSET_EDITOR_EL,
};
const CREATE_DISABLED_ATTR = {name: 'disabled', parser: BooleanParser, selector: CREATE_BUTTON_EL};
const HEIGHT_ATTR = {name: 'asset-height', parser: FloatParser, selector: ASSET_EDITOR_EL};
const NAME_ATTR = {name: 'asset-name', parser: StringParser, selector: ASSET_EDITOR_EL};
const WIDTH_ATTR = {name: 'asset-width', parser: FloatParser, selector: ASSET_EDITOR_EL};

/**
 * The main landing view of the app.
 */
@customElement({
  dependencies: ImmutableSet.of([AssetCollection, Editor]),
  tag: 'pa-create-asset-view',
  templateKey: 'src/project/create-asset-view',
})
export class CreateAssetView extends BaseThemedElement2 {
  private readonly routeFactoryService_: RouteFactoryService;
  private readonly routeService_: RouteService<Views>;

  /**
   * @param themeService
   * @param projectCollection
   */
  constructor(
      @inject('pa.routing.RouteFactoryService') routeFactoryService: RouteFactoryService,
      @inject('gs.routing.RouteService') routeService: RouteService<Views>,
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);
    this.routeFactoryService_ = routeFactoryService;
    this.routeService_ = routeService;
  }

  /**
   * @return Project ID of the view, or null if there is none.
   */
  private getProjectId_(routeNavigator: RouteNavigator<Views>): string | null {
    const route = routeNavigator.getRoute(this.routeFactoryService_.createAsset());
    return route === null ? null : route.params.projectId;
  }

  /**
   * Handles event when the cancel button is clicked.
   */
  @onDom.event(CANCEL_BUTTON_EL, 'gs-action')
  onCancelAction_(
      @monadOut((view: CreateAssetView) => view.routeService_.monad())
          routeSetter: MonadSetter<RouteNavigator<Views>>): MonadValue<any>[] {
    const projectId = this.getProjectId_(routeSetter.value);
    if (projectId !== null) {
      return [
        routeSetter.set(routeSetter.value.goTo(
            this.routeFactoryService_.assetList(),
            {projectId})),
      ];
    }

    return [];
  }

  /**
   * Handles event when the submit button is clicked.
   *
   * @return Promise that will be resolved when all handling logic have completed.
   */
  @onDom.event(CREATE_BUTTON_EL, 'gs-action')
  async onSubmitAction_(
      @dom.attribute(NAME_ATTR) assetName: string | null,
      @dom.attribute(ASSET_TYPE_ATTR) assetType: AssetType | null,
      @dom.attribute(HEIGHT_ATTR) height: number | null,
      @dom.attribute(WIDTH_ATTR) width: number | null,
      @monad(AssetManager.idMonad()) newIdPromise: Promise<string>,
      @monadOut(ProjectManager.monad()) projectAccessSetter: MonadSetter<DataAccess<Project>>,
      @monadOut(AssetManager.monad()) assetAccessSetter: MonadSetter<DataAccess<Asset2>>,
      @monadOut((view: CreateAssetView) => view.routeService_.monad())
          routeSetter: MonadSetter<RouteNavigator<Views>>): Promise<MonadValue<any>[]> {
    if (!assetName) {
      throw new Error('Asset name is not set');
    }

    if (assetType === null) {
      throw new Error('Asset type is not set');
    }

    if (height === null || Number.isNaN(height)) {
      throw new Error('Asset height is not set');
    }

    if (width === null || Number.isNaN(width)) {
      throw new Error('Asset width is not set');
    }

    const projectId = this.getProjectId_(routeSetter.value);
    if (projectId === null) {
      return [];
    }
    const project = await projectAccessSetter.value.get(projectId);
    if (project === null) {
      Log.warn(LOG, 'No projects found for project ID:', projectId);
      return [];
    }
    const id = await newIdPromise;
    const asset = Asset2.withId(id, projectId)
        .setName(assetName)
        .setType(assetType)
        .setHeight(height)
        .setWidth(width);

    MonadUtil.callFunction({type: 'submit'}, this, 'reset_');

    return [
      assetAccessSetter.set(assetAccessSetter.value.queueUpdate(id, asset)),
      projectAccessSetter.set(
          projectAccessSetter.value.queueUpdate(
              projectId,
              project.setAssets(project.getAssets().add(id)))),
      routeSetter.set(
          routeSetter.value.goTo(
              this.routeFactoryService_.assetList(), {projectId})),
    ];
  }

  /**
   * Resets the form.
   */
  @onLifecycle('create')
  @onDom.event(CANCEL_BUTTON_EL, 'gs-action')
  reset_(
      @domOut.attribute(NAME_ATTR) assetNameSetter: MonadSetter<string | null>,
      @domOut.attribute(ASSET_TYPE_ATTR) assetTypeSetter: MonadSetter<AssetType | null>,
      @domOut.attribute(HEIGHT_ATTR) heightSetter: MonadSetter<number | null>,
      @domOut.attribute(WIDTH_ATTR) widthSetter: MonadSetter<number | null>):
      ImmutableList<MonadValue<any>> {
    return ImmutableList.of([
      assetNameSetter.set(null),
      assetTypeSetter.set(null),
      heightSetter.set(null),
      widthSetter.set(null),
    ]);
  }

  /**
   * Verifies the input values.
   */
  @onDom.attributeChange(ASSET_TYPE_ATTR)
  @onDom.attributeChange(NAME_ATTR)
  @onDom.attributeChange(HEIGHT_ATTR)
  @onDom.attributeChange(WIDTH_ATTR)
  verifyInput_(
      @dom.attribute(NAME_ATTR) assetName: string | null,
      @dom.attribute(ASSET_TYPE_ATTR) assetType: AssetType | null,
      @dom.attribute(HEIGHT_ATTR) height: number | null,
      @dom.attribute(WIDTH_ATTR) width: number | null,
      @domOut.attribute(CREATE_DISABLED_ATTR) createDisabledSetter: MonadSetter<boolean | null>):
      Iterable<MonadValue<any>> {
    const isDisabled =
        !assetName
        || assetType === null
        || Number.isNaN(width || NaN)
        || Number.isNaN(height || NaN);
    return ImmutableList.of([createDisabledSetter.set(isDisabled)]);
  }
}
