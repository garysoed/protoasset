import {inject} from 'external/gs_tools/src/inject';
import {bind, customElement, DomBridge, handle, StringParser} from 'external/gs_tools/src/webc';

import {BaseThemedElement} from 'external/gs_ui/src/common';
import {ThemeService} from 'external/gs_ui/src/theming';

import {Asset} from '../data/asset';
import {AssetCollection} from '../data/asset-collection';


/**
 * Displays an asset item.
 */
@customElement({
  tag: 'pa-asset-item',
  templateKey: 'src/project/asset-item',
})
export class AssetItem extends BaseThemedElement {
  @bind('#assetName').innerText()
  private readonly assetNameBridge_: DomBridge<string>;

  @bind(null).attribute('gs-asset-id', StringParser)
  private readonly gsAssetIdBridge_: DomBridge<string>;

  @bind(null).attribute('gs-project-id', StringParser)
  private readonly gsProjectIdBridge_: DomBridge<string>;

  private readonly assetCollection_: AssetCollection;

  constructor(
      @inject('pa.data.AssetCollection') assetCollection: AssetCollection,
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);
    this.assetCollection_ = assetCollection;
    this.assetNameBridge_ = DomBridge.of<string>();
    this.gsAssetIdBridge_ = DomBridge.of<string>();
    this.gsProjectIdBridge_ = DomBridge.of<string>();
  }

  @handle(null).attributeChange('gs-asset-id', StringParser)
  protected onGsAssetIdChanged_(): Promise<any> {
    let assetId = this.gsAssetIdBridge_.get();
    let projectId = this.gsProjectIdBridge_.get();
    if (assetId === null || projectId === null) {
      this.assetNameBridge_.delete();
      return Promise.resolve();
    }

    return this.assetCollection_
        .get(projectId, assetId)
        .then((asset: Asset | null) => {
          if (asset !== null) {
            this.assetNameBridge_.set(asset.getName());
          }
        });
  }
}
