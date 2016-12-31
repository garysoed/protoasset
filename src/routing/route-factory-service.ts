import {bind, inject} from 'external/gs_tools/src/inject';
import {Reflect} from 'external/gs_tools/src/util';

import {
  AbstractRouteFactory,
  IRouteFactoryService,
  SimpleRouteFactory} from 'external/gs_ui/src/routing';

import {ProjectCollection} from '../data/project-collection';

import {AssetListRouteFactory} from './asset-list-route-factory';
import {CreateAssetRouteFactory} from './create-asset-route-factory';
import {Views} from './views';


@bind('pa.routing.RouteFactoryService', [
  ProjectCollection,
])
export class RouteFactoryService implements IRouteFactoryService<Views> {
  private readonly projectCollection_: ProjectCollection;
  private createAsset_: CreateAssetRouteFactory;
  private createProject_: SimpleRouteFactory<Views>;
  private landing_: SimpleRouteFactory<Views>;
  private assetList_: AssetListRouteFactory;

  constructor(@inject('pa.data.ProjectCollection') projectCollection: ProjectCollection) {
    this.projectCollection_ = projectCollection;
  }

  /**
   * Initializes the service.
   */
  [Reflect.__initialize](): void {
    this.landing_ = new SimpleRouteFactory(Views.LANDING, '/home', 'Protoasset');

    this.createProject_ = new SimpleRouteFactory(
        Views.CREATE_PROJECT,
        '/create',
        'Create Project',
        this.landing_);
    this.assetList_ = new AssetListRouteFactory(
        this.projectCollection_,
        this.landing_);

    this.createAsset_ = new CreateAssetRouteFactory(this.assetList_);
  }

  /**
   * @return The route factory for the asset list view.
   */
  assetList(): AssetListRouteFactory {
    return this.assetList_;
  }

  /**
   * @return The route factory for the create asset view.
   */
  createAsset(): CreateAssetRouteFactory {
    return this.createAsset_;
  }

  /**
   * @return The route factory for the create project view.
   */
  createProject(): SimpleRouteFactory<Views> {
    return this.createProject_;
  }

  /**
   * @override
   */
  getFactories(): AbstractRouteFactory<Views, any, any>[] {
    return [
      this.landing_,
      this.createProject_,
      this.assetList_,
      this.createAsset_,
    ];
  }

  /**
   * @return The route factory for the landing view.
   */
  landing(): SimpleRouteFactory<Views> {
    return this.landing_;
  }
}
