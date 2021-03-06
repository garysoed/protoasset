import { atomic } from 'external/gs_tools/src/async';
import { BaseDisposable } from 'external/gs_tools/src/dispose';
import { ImmutableList } from 'external/gs_tools/src/immutable';
import { bind, inject } from 'external/gs_tools/src/inject';
import { BaseIdGenerator, SimpleIdGenerator } from 'external/gs_tools/src/random';
import { ApiClient, PostMessageChannel } from 'external/gs_tools/src/rpc';

import { Asset } from '../data/asset';
import { BaseLayer } from '../data/base-layer';
import { RenderRequest } from '../data/render-request';
import { RenderResponse, RenderResponseType } from '../data/render-response';
import { TemplateCompilerService } from '../data/template-compiler-service';

type HtmlComponents = {css: string, html: string};


export function checkResponse(request: RenderRequest, response: RenderResponse): boolean {
  return response.id === request.id;
}


@bind('pa.render.RenderService')
export class RenderService extends BaseDisposable {
  private readonly idGenerator_: BaseIdGenerator;
  private iframeElPromise_: Promise<HTMLIFrameElement> | null;
  private renderClientPromise_: Promise<ApiClient<RenderRequest, RenderResponse>> | null;
  private readonly templateCompilerService_: TemplateCompilerService;
  private readonly window_: Window;

  constructor(
      @inject('pa.data.TemplateCompilerService') templateCompilerService: TemplateCompilerService,
      @inject('x.dom.window') window: Window) {
    super();
    this.idGenerator_ = new SimpleIdGenerator();
    this.iframeElPromise_ = null;
    this.renderClientPromise_ = null;
    this.templateCompilerService_ = templateCompilerService;
    this.window_ = window;
  }

  private getIframeElPromise_(): Promise<HTMLIFrameElement> {
    if (this.iframeElPromise_ !== null) {
      return this.iframeElPromise_;
    }

    const promise = new Promise(
        (resolve: (data: any) => void, _: (data: any) => void) => {
          const iframeEl = this.window_.document.createElement('iframe');
          iframeEl.style.visibility = 'hidden';
          iframeEl.style.position = 'fixed';
          iframeEl.style.top = '0';
          iframeEl.src = '../render/render.html';
          iframeEl.addEventListener('load', () => {
            resolve(iframeEl);
          });

          this.window_.document.body.appendChild(iframeEl);
        });
    this.iframeElPromise_ = promise;
    return promise;
  }

  private  getRenderClientPromise_(): Promise<ApiClient<RenderRequest, RenderResponse>> {
    if (this.renderClientPromise_ !== null) {
      return this.renderClientPromise_;
    }

    const clientPromise = this.getIframeElPromise_()
        .then((iframeEl: HTMLIFrameElement) => {
          return PostMessageChannel.open(this.window_, iframeEl.contentWindow);
        })
        .then((channel: PostMessageChannel) => {
          return ApiClient.of(channel, checkResponse, RenderResponseType);
        });
    this.renderClientPromise_ = clientPromise;
    return clientPromise;
  }

  @atomic()
  async render(asset: Asset, data: string[]): Promise<string | null> {
    const layers = asset.getLayers();
    const htmlComponents = ImmutableList
        .of(layers)
        .reverse()
        .reduce<HtmlComponents>(
            (previousResult: HtmlComponents, layer: BaseLayer) => {
              const components = layer.asHtml();
              return {
                css: previousResult.css + components.css,
                html: previousResult.html + components.html,
              };
            },
            {css: '', html: ''});
    const height = asset.getHeight();
    const width = asset.getWidth();
    const compiler = this.templateCompilerService_.create(asset, data);
    const [client, iframeEl] = await Promise.all([
      this.getRenderClientPromise_(),
      this.getIframeElPromise_(),
    ]);
    iframeEl.height = `${height}px`;
    iframeEl.width = `${width}px`;

    const id = this.idGenerator_.generate([]);
    const response = await client.post({
      css: compiler.compile(htmlComponents.css),
      height: height,
      html: compiler.compile(htmlComponents.html),
      id,
      width: width,
    });

    return response.uri;
  }
}
// TODO: Mutable
