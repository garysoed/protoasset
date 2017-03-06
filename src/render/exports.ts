import { Jsons } from 'external/gs_tools/src/collection';

import { RenderMain } from '../render/render-main';

function bootstrap(html2Canvas: Html2CanvasStatic, window: Window): void {
  const main = new RenderMain(html2Canvas, window);
  main.run();
};

Jsons.setValue(window, 'par.bootstrap', bootstrap);
