import {inject} from 'external/gs_tools/src/inject';
import {customElement} from 'external/gs_tools/src/webc';

import {BaseThemedElement} from 'external/gs_ui/src/common';
import {ThemeService} from 'external/gs_ui/src/theming';


/**
 * Displays layer editor
 */
@customElement({
  tag: 'pa-asset-layer-view',
  templateKey: 'src/asset/layer-view',
})
export class LayerView extends BaseThemedElement {
  constructor(
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);
  }
}
