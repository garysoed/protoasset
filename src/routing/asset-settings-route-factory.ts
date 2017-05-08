import { AbstractRouteFactory } from 'external/gs_ui/src/routing';

import { AssetCollection } from '../data/asset-collection';
import { Views } from '../routing/views';


type CP = {};
type PR = {assetId: string, projectId: string};
type CR = CP & PR;

export class AssetSettingsRouteFactory extends AbstractRouteFactory<Views, CP, CR, PR> {
  private readonly assetCollection_: AssetCollection;

  constructor(
      assetCollection: AssetCollection,
      parent: AbstractRouteFactory<Views, any, PR, any>) {
    super(Views.ASSET_SETTINGS, parent);
    this.assetCollection_ = assetCollection;
  }

  /**
   * @override
   */
  async getName(params: CR): Promise<string> {
    const asset = await this.assetCollection_.get(params.projectId, params.assetId);
    if (asset === null) {
      return 'Settings';
    }

    return `Settings for ${asset.getName()}`;
  }

  /**
   * @override
   */
  getRelativeMatcher_(): string {
    return '/settings';
  }

  /**
   * @override
   */
  getRelativeMatchParams_(matches: {[key: string]: string}): CP {
    return {};
  }

  /**
   * @override
   */
  getRelativePath_(params: CP): string {
    return '/settings';
  }
}
