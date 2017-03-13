import { inject } from 'external/gs_tools/src/inject';
import { customElement } from 'external/gs_tools/src/webc';

import { BaseThemedElement } from 'external/gs_ui/src/common';
import { ThemeService } from 'external/gs_ui/src/theming';


/**
 * Render View
 */
@customElement({
  tag: 'pa-asset-render-view',
  templateKey: 'src/asset/render-view',
})
export class RenderView extends BaseThemedElement {
  constructor(
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);
  }
}
