import {inject} from 'external/gs_tools/src/inject';
import {customElement} from 'external/gs_tools/src/webc';

import {BaseThemedElement} from 'external/gs_ui/src/common';
import {ThemeService} from 'external/gs_ui/src/theming';


/**
 * Image Layer
 */
@customElement({
  tag: 'pa-asset-image-layer-editor',
  templateKey: 'src/asset/image-layer-editor',
})
export class ImageLayerEditor extends BaseThemedElement {
  constructor(
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);
  }
}
