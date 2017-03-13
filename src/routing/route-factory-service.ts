import { bind, inject } from 'external/gs_tools/src/inject';
import { Reflect } from 'external/gs_tools/src/util';

import {
  AbstractRouteFactory,
  IRouteFactoryService,
  SimpleRouteFactory } from 'external/gs_ui/src/routing';

import { AssetCollection } from '../data/asset-collection';
import { ProjectCollection } from '../data/project-collection';
import { AssetListRouteFactory } from '../routing/asset-list-route-factory';
import { AssetMainRouteFactory } from '../routing/asset-main-route-factory';
import { AssetSettingsRouteFactory } from '../routing/asset-settings-route-factory';
import { HelperRouteFactory } from '../routing/helper-route-factory';
import { Views } from '../routing/views';


@bind('pa.routing.RouteFactoryService', [
  AssetCollection,
  ProjectCollection,
])
export class RouteFactoryService implements IRouteFactoryService<Views> {
  private readonly assetCollection_: AssetCollection;
  private readonly projectCollection_: ProjectCollection;
  private assetData_: SimpleRouteFactory<Views, {assetId: string, projectId: string}>;
  private assetList_: AssetListRouteFactory;
  private assetMain_: AssetMainRouteFactory;
  private assetSettings_: AssetSettingsRouteFactory;
  private createAsset_: SimpleRouteFactory<Views, {projectId: string}>;
  private createProject_: SimpleRouteFactory<Views, {}>;
  private helper_: HelperRouteFactory;
  private helperList_: SimpleRouteFactory<Views, {assetId: string, projectId: string}>;
  private landing_: SimpleRouteFactory<Views, {}>;
  private layer_: SimpleRouteFactory<Views, {assetId: string, projectId: string}>;
  private render_: SimpleRouteFactory<Views, {assetId: string, projectId: string}>;

  constructor(
      @inject('pa.data.AssetCollection') assetCollection: AssetCollection,
      @inject('pa.data.ProjectCollection') projectCollection: ProjectCollection) {
    this.assetCollection_ = assetCollection;
    this.projectCollection_ = projectCollection;
  }

  /**
   * Initializes the service.
   */
  [Reflect.__initialize](): void {
    // /home
    this.landing_ = new SimpleRouteFactory(Views.LANDING, '/home', 'Protoasset');

    // /home/create
    this.createProject_ = new SimpleRouteFactory(
        Views.CREATE_PROJECT,
        '/create',
        'Create Project',
        this.landing_);

    // /home/project/:projectId
    this.assetList_ = new AssetListRouteFactory(
        this.projectCollection_,
        this.landing_);

    // /home/project/:projectId/asset/:assetId
    this.assetMain_ = new AssetMainRouteFactory(this.assetCollection_, this.assetList_);

    // /home/project/:projectId/create
    this.createAsset_ = new SimpleRouteFactory(
        Views.CREATE_ASSET,
        '/create',
        'Create Asset',
        this.assetList_);

    // /home/project/:projectId/asset/:assetId/data
    this.assetData_ = new SimpleRouteFactory(
        Views.ASSET_DATA,
        '/data',
        'Asset Data',
        this.assetMain_);

    // /home/project/:projectId/asset/:assetId/helper
    this.helperList_ = new SimpleRouteFactory(
        Views.HELPER_LIST,
        '/helper',
        'Helpers',
        this.assetMain_);

    // /home/project/:projectId/asset/:assetId/helper/:helperId
    this.helper_ = new HelperRouteFactory(this.assetCollection_, this.helperList_);

    // /home/project/:projectId/asset/:assetId/layer
    this.layer_ = new SimpleRouteFactory(
        Views.LAYER,
        '/layer',
        'Layers',
        this.assetMain_);

    // /home/project/:projectId/asset/:assetId/render
    this.render_ = new SimpleRouteFactory(
        Views.RENDER,
        '/render',
        'Render',
        this.assetMain_);

    // /home/project/:projectId/asset/:assetId/settings
    this.assetSettings_ = new AssetSettingsRouteFactory(this.assetCollection_, this.assetMain_);
  }

  assetData(): SimpleRouteFactory<Views, {assetId: string, projectId: string}> {
    return this.assetData_;
  }

  /**
   * @return The route factory for the asset list view.
   */
  assetList(): AssetListRouteFactory {
    return this.assetList_;
  }

  /**
   * @return The route factory for the asset main view.
   */
  assetMain(): AssetMainRouteFactory {
    return this.assetMain_;
  }

  /**
   * @return The route factory for the asset settings view.
   */
  assetSettings(): AssetSettingsRouteFactory {
    return this.assetSettings_;
  }

  /**
   * @return The route factory for the create asset view.
   */
  createAsset(): SimpleRouteFactory<Views, {projectId: string}> {
    return this.createAsset_;
  }

  /**
   * @return The route factory for the create project view.
   */
  createProject(): SimpleRouteFactory<Views, {}> {
    return this.createProject_;
  }

  /**
   * @override
   */
  getFactories(): AbstractRouteFactory<Views, any, any, any>[] {
    return [
      this.landing_,
      this.createProject_,
      this.assetList_,
      this.assetMain_,
      this.createAsset_,
      this.assetData_,
      this.assetSettings_,
      this.helper_,
      this.helperList_,
      this.layer_,
      this.render_,
    ];
  }

  /**
   * @return The route factory for the helper view.
   */
  helper(): HelperRouteFactory {
    return this.helper_;
  }

  /**
   * @return The route factory for the helper list view.
   */
  helperList(): SimpleRouteFactory<Views, {assetId: string, projectId: string}> {
    return this.helperList_;
  }

  /**
   * @return The route factory for the landing view.
   */
  landing(): SimpleRouteFactory<Views, {}> {
    return this.landing_;
  }

  /**
   * @return The route factory for the layer view.
   */
  layer(): SimpleRouteFactory<Views, {assetId: string, projectId: string}> {
    return this.layer_;
  }

  /**
   * @return The route factory for the render view.
   */
  render(): SimpleRouteFactory<Views, {assetId: string, projectId: string}> {
    return this.render_;
  }
}
