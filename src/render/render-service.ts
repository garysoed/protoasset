import { atomic } from 'external/gs_tools/src/async';
import { Arrays } from 'external/gs_tools/src/collection';
import { BaseDisposable } from 'external/gs_tools/src/dispose';
import { bind, inject } from 'external/gs_tools/src/inject';
import { PostMessageChannel } from 'external/gs_tools/src/ui';

import { Asset } from '../data/asset';
import { BaseLayer } from '../data/base-layer';
import { TemplateCompilerService } from '../data/template-compiler-service';

type HtmlComponents = {css: string, html: string};


@bind('pa.render.RenderService')
export class RenderService extends BaseDisposable {
  private readonly templateCompilerService_: TemplateCompilerService;
  private readonly window_: Window;

  private iframeElPromise_: Promise<HTMLIFrameElement> | null;
  private iframeElChannelPromise_: Promise<PostMessageChannel> | null;

  constructor(
      @inject('pa.data.TemplateCompilerService') templateCompilerService: TemplateCompilerService,
      @inject('x.dom.window') window: Window) {
    super();
    this.iframeElPromise_ = null;
    this.iframeElChannelPromise_ = null;
    this.templateCompilerService_ = templateCompilerService;
    this.window_ = window;
  }

  private getIframeElPromise_(): Promise<HTMLIFrameElement> {
    if (this.iframeElPromise_ !== null) {
      return this.iframeElPromise_;
    }

    const promise = new Promise(
        (resolve: (data: any) => void, reject: (data: any) => void) => {
          let iframeEl = this.window_.document.createElement('iframe');
          iframeEl.style.visibility = 'hidden';
          iframeEl.style.position = 'fixed';
          iframeEl.style.top = '0';
          iframeEl.src = 'src/render/render-app.html';
          iframeEl.addEventListener('load', () => {
            resolve(iframeEl);
          });

          this.window_.document.body.appendChild(iframeEl);
        });
    this.iframeElPromise_ = promise;
    return promise;
  }

  @atomic()
  async render(asset: Asset, data: string[]): Promise<string | null> {
    const layers = asset.getLayers();
    const htmlComponents = Arrays
        .of(layers)
        .reduce<HtmlComponents>(
            (layer: BaseLayer, index: number, previousResult: HtmlComponents) => {
              const components = layer.asHtml();
              return {
                css: previousResult.css + components.css,
                html: previousResult.html + components.html,
              };
            },
            {css: '', html: ''});
    const templateDom =
        `<head><style>${htmlComponents.css}</style></head><body>${htmlComponents.html}</body>`;
    const dom = this.templateCompilerService_.create(asset, data).compile(templateDom);
    const iframeEl = await this.getIframeElPromise_();
    iframeEl.setAttribute('srcdoc', dom);

    // TODO: post message through the channel.
    return Promise.resolve('test');
  }
}
