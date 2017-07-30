import { Log } from 'external/gs_tools/src/util';

import { Asset2, AssetSearchIndex } from '../data/asset2';
import { FuseBackedManager } from '../data/fuse-backed-manager';

const LOGGER: Log = Log.of('protoasset.data.AssetManager');

class AssetManagerImpl extends FuseBackedManager<AssetSearchIndex, Asset2> {
  static of(window: Window): AssetManagerImpl {
    return new AssetManagerImpl('pa.assets', LOGGER, window);
  }
}

export const AssetManager = AssetManagerImpl.of(window);
