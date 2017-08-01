import { ImmutableMap } from 'external/gs_tools/src/immutable';
import { AbstractRouteFactory } from 'external/gs_ui/src/routing';

import { AssetManager } from '../data/asset-manager';
import { Views } from '../routing/views';

type CP = {assetId: string};
type PR = {projectId: string};
type CR = CP & PR;


export class AssetMainRouteFactory extends AbstractRouteFactory<Views, CP, CR, PR> {

  constructor(parent: AbstractRouteFactory<Views, any, PR, any>) {
    super(Views.ASSET_DATA, parent);
  }

  /**
   * @override
   */
  async getName(params: CR): Promise<string> {
    const asset = await AssetManager.monad()(this).get().get(params.assetId);
    if (asset === null) {
      return 'Unknown asset';
    } else {
      return asset.getName();
    }
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
  getRelativeMatchParams_(matches: ImmutableMap<string, string>): CP {
    const assetId = matches.get('assetId');
    if (!assetId) {
      throw new Error(`Expected assetId does not exist`);
    }
    return {assetId};
  }

  /**
   * @override
   */
  protected getRelativePath_(params: CP): string {
    return `/asset/${params.assetId}`;
  }
}
