import {Asset} from './asset';
import {LocalStorage} from 'external/gs_tools/src/store';


/**
 * Provides collection of assets.
 */
export class AssetCollection {
  private storage_: LocalStorage<Asset>;

  constructor(window: Window) {
    this.storage_ = new LocalStorage<Asset>(window, 'pa.assets');
  }
}
