import { AbstractRouteFactory } from 'external/gs_ui/src/routing';

import { AssetCollection } from '../data/asset-collection';

import { Views } from './views';

type CP = {assetId: string};
type PR = {projectId: string};
type CR = CP & PR;


export class AssetMainRouteFactory extends AbstractRouteFactory<Views, CP, CR, PR> {
  private readonly assetCollection_: AssetCollection;

  constructor(
      assetCollection: AssetCollection,
      parent: AbstractRouteFactory<Views, any, PR, any>) {
    super(Views.ASSET_DATA, parent);
    this.assetCollection_ = assetCollection;
  }

  /**
   * @override
   */
  protected getRelativePath_(params: CP): string {
    return `/asset/${params.assetId}`;
  }

  /**
   * @override
   */
  getRelativeMatchParams_(matches: {[key: string]: string}): CP {
    return {
      assetId: matches['assetId'],
    };
  }

  /**
   * @override
   */
  getRelativeMatcher_(): string {
    return `/asset/:assetId`;
  }

  /**
   * @override
   */
  async getName(params: CR): Promise<string> {
    let asset = await this.assetCollection_.get(params.projectId, params.assetId);
    if (asset === null) {
      return 'Unknown asset';
    } else {
      return asset.getName();
    }
  }
}
