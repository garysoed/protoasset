import {inject} from 'external/gs_tools/src/inject';
import {customElement} from 'external/gs_tools/src/webc';

import {BaseThemedElement} from 'external/gs_ui/src/common';
import {ThemeService} from 'external/gs_ui/src/theming';

import {AssetListView} from './asset-list-view';
import {CreateAssetView} from './create-asset-view';


/**
 * The main landing view of the app.
 */
@customElement({
  dependencies: [AssetListView, CreateAssetView],
  tag: 'pa-project-view',
  templateKey: 'src/project/project-view',
})
export class ProjectView extends BaseThemedElement {
  constructor(
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);
  }
}
