import { BaseDisposable } from 'external/gs_tools/src/dispose';
import { ApiServer, PostMessageChannel } from 'external/gs_tools/src/rpc';

import { RenderRequest, RenderRequestType } from '../data/render-request';
import { RenderResponse } from '../data/render-response';


export class RenderMain extends BaseDisposable {
  private readonly html2Canvas_: Html2CanvasStatic;
  private readonly window_: Window;

  constructor(html2Canvas: Html2CanvasStatic, window: Window) {
    super();
    this.html2Canvas_ = html2Canvas;
    this.window_ = window;
  }

  /**
   * @return The canvas element on the page.
   */
  private getCanvasEl_(): HTMLCanvasElement {
    return this.window_.document.body.querySelector('canvas');
  }

  /**
   * Processes the request from the main app.
   * @param request The request to process.
   * @return Promise that will be resolved with the response.
   */
  private processRequest_(request: RenderRequest): Promise<RenderResponse> {
    const styleEl = this.window_.document.head.querySelector('style');
    styleEl.innerHTML = request.css;

    const rootEl = this.window_.document.body.querySelector('div');
    rootEl.innerHTML = request.html;

    const canvasEl = this.getCanvasEl_();
    canvasEl.width = request.width;
    canvasEl.height = request.height;

    return new Promise((resolve: (value: RenderResponse) => void) => {
      this.window_.setTimeout(() => {
        this.html2Canvas_(rootEl, {
          onrendered: this.onRendered_.bind(this, resolve, request),
          useCORS: true,
        });
      }, 100);
    });
  }

  /**
   *
   * @param resolve Function to call with the result of the rendering.
   * @param request The request used to render.
   * @param canvas Canvas object that the render result of html2canvas is in.
   */
  private onRendered_(
      resolve: (value: RenderResponse) => void,
      request: RenderRequest,
      canvas: HTMLCanvasElement): void {
    const targetCanvasEl = this.getCanvasEl_();
    const ctx = targetCanvasEl.getContext('2d');
    if (ctx === null) {
      throw new Error('2d context cannot be found');
    }

    ctx.drawImage(canvas, 0, 0, request.width, request.height);
    let dataUri = targetCanvasEl.toDataURL('image/png');
    resolve({id: request.id, uri: dataUri});
  }

  /**
   * Sets up and runs the server.
   * @return Promise that will be resolved when the server is running.
   */
  async run(): Promise<void> {
    const channel = await PostMessageChannel
        .listen(this.window_, PostMessageChannel.getOrigin(this.window_));
    const server = ApiServer.of(channel, this.processRequest_.bind(this), RenderRequestType);
    server.run();
    this.addDisposable(channel);
  }
};
