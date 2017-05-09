import { inject } from 'external/gs_tools/src/inject';
import { customElement } from 'external/gs_tools/src/webc';

import { BaseThemedElement } from 'external/gs_ui/src/common';
import { ThemeService } from 'external/gs_ui/src/theming';

import { AssetView } from '../asset/asset-view';

import { AssetListView } from '../project/asset-list-view';
import { CreateAssetView } from '../project/create-asset-view';
import { SettingsView } from '../project/settings-view';


/**
 * The main landing view of the app.
 */
@customElement({
  dependencies: [AssetListView, AssetView, CreateAssetView, SettingsView],
  tag: 'pa-project-view',
  templateKey: 'src/project/project-view',
})
export class ProjectView extends BaseThemedElement {
  constructor(
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);
  }
}
// TODO: Mutable
