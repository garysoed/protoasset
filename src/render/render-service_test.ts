import { assert, Matchers, TestBase } from '../test-base';
TestBase.setup();

import { Mocks } from 'external/gs_tools/src/mock';
import { ApiClient, PostMessageChannel } from 'external/gs_tools/src/rpc';
import { TestDispose } from 'external/gs_tools/src/testing';

import { RenderResponseType } from '../data/render-response';
import { checkResponse, RenderService } from '../render/render-service';


describe('checkResponse', () => {
  it('should return true if the IDs are the same', () => {
    const id = 'id';
    const request = Mocks.object('request');
    request.id = id;

    const response = Mocks.object('response');
    response.id = id;
    assert(checkResponse(request, response)).to.beTrue();
  });

  it('should return false if the IDs are different', () => {
    const request = Mocks.object('request');
    request.id = 'id1';

    const response = Mocks.object('response');
    response.id = 'id2';
    assert(checkResponse(request, response)).to.beFalse();
  });
});


describe('render.RenderService', () => {
  let mockTemplateCompilerService;
  let window;
  let service: RenderService;

  beforeEach(() => {
    mockTemplateCompilerService = jasmine.createSpyObj('TemplateCompilerService', ['create']);
    window = Mocks.object('window');
    service = new RenderService(mockTemplateCompilerService, window);
    TestDispose.add(service);
  });

  describe('getIframeElPromise_', () => {
    it('should return a promise that resolves when the iframe element has been loaded',
        async (done: any) => {
          const mockIframeEl = jasmine.createSpyObj('IframeEl', ['addEventListener']);
          mockIframeEl.style = {};
          mockIframeEl.addEventListener.and.callFake((event: string, callback: Function) => {
            callback();
          });

          const mockDocument = jasmine.createSpyObj('Document', ['createElement']);
          mockDocument.createElement.and.returnValue(mockIframeEl);
          window.document = mockDocument;

          const mockBody = jasmine.createSpyObj('Body', ['appendChild']);
          mockDocument.body = mockBody;

          const promise = service['getIframeElPromise_']();
          assert(await promise).to.equal(mockIframeEl);
          assert(service['iframeElPromise_']).to.equal(promise);
          assert(mockBody.appendChild).to.haveBeenCalledWith(mockIframeEl);
          assert(mockIframeEl.addEventListener).to
              .haveBeenCalledWith('load', Matchers.any(Function));
          assert(mockIframeEl.src).to.equal('../render/render.html');
          assert(mockDocument.createElement).to.haveBeenCalledWith('iframe');
        });

    it('should return the cached promise', () => {
      const promise = Mocks.object('promise');
      service['iframeElPromise_'] = promise;

      const mockDocument = jasmine.createSpyObj('Document', ['createElement']);
      window.document = mockDocument;
      assert(service['getIframeElPromise_']()).to.be(promise);

      assert(mockDocument.createElement).toNot.haveBeenCalled();
    });
  });

  describe('getRenderClientPromise_', () => {
    it('should return a promise that resolves with the API client', async (done: any) => {
      const client = Mocks.object('client');
      spyOn(ApiClient, 'of').and.returnValue(client);

      const channel = Mocks.object('channel');
      spyOn(PostMessageChannel, 'open').and.returnValue(Promise.resolve(channel));

      const contentWindow = Mocks.object('contentWindow');
      spyOn(service, 'getIframeElPromise_').and.returnValue(Promise.resolve({contentWindow}));

      const promise = service['getRenderClientPromise_']();
      assert(await promise).to.equal(client);
      assert(service['renderClientPromise_']).to.equal(promise);
      assert(ApiClient.of).to.haveBeenCalledWith(channel, checkResponse, RenderResponseType);
      assert(PostMessageChannel.open).to.haveBeenCalledWith(window, contentWindow);
    });

    it('should return the cached promise', () => {
      const cachedPromise = Mocks.object('cachedPromise');
      service['renderClientPromise_'] = cachedPromise;
      spyOn(PostMessageChannel, 'open');
      spyOn(ApiClient, 'of');

      assert(service['getRenderClientPromise_']()).to.be(cachedPromise);
      assert(ApiClient.of).toNot.haveBeenCalled();
      assert(PostMessageChannel.open).toNot.haveBeenCalled();
    });
  });

  describe('render', () => {
    it('should post the correct request and return the correct URI', async (done: any) => {
      const uri = 'uri';
      const mockClient = jasmine.createSpyObj('Client', ['post']);
      mockClient.post.and.returnValue(Promise.resolve({uri}));
      spyOn(service, 'getRenderClientPromise_').and.returnValue(Promise.resolve(mockClient));

      const html1 = 'html1';
      const css1 = 'css1';
      const mockLayer1 = jasmine.createSpyObj('Layer1', ['asHtml']);
      mockLayer1.asHtml.and.returnValue({css: css1, html: html1});

      const html2 = 'html2';
      const css2 = 'css2';
      const mockLayer2 = jasmine.createSpyObj('Layer2', ['asHtml']);
      mockLayer2.asHtml.and.returnValue({css: css2, html: html2});

      const combinedHtml = `${html2}${html1}`;
      const combinedCss = `${css2}${css1}`;
      const compiledCss = 'compiledCss';
      const compiledHtml = 'compiledHtml';
      const mockCompiler = jasmine.createSpyObj('Compiler', ['compile']);
      mockCompiler.compile.and.callFake((uncompiledString: string) => {
        switch (uncompiledString) {
          case combinedCss:
            return compiledCss;
          case combinedHtml:
            return compiledHtml;
        }
      });
      mockTemplateCompilerService.create.and.returnValue(mockCompiler);

      const iframeEl = Mocks.object('iframeEl');
      spyOn(service, 'getIframeElPromise_').and.returnValue(Promise.resolve(iframeEl));

      const id = 'id';
      spyOn(service['idGenerator_'], 'generate').and.returnValue(id);

      const data = Mocks.object('data');
      const height = 123;
      const width = 456;
      const mockAsset = jasmine.createSpyObj('Asset', ['getHeight', 'getLayers', 'getWidth']);
      mockAsset.getHeight.and.returnValue(height);
      mockAsset.getLayers.and.returnValue([mockLayer1, mockLayer2]);
      mockAsset.getWidth.and.returnValue(width);
      assert(await service.render(mockAsset, data)).to.equal(uri);
      assert(mockClient.post).to.haveBeenCalledWith({
        css: compiledCss,
        height,
        html: compiledHtml,
        id,
        width,
      });
      assert(mockCompiler.compile).to.haveBeenCalledWith(combinedHtml);
      assert(mockCompiler.compile).to.haveBeenCalledWith(combinedCss);
      assert(iframeEl.height).to.equal(`${height}px`);
      assert(iframeEl.width).to.equal(`${width}px`);
      assert(mockTemplateCompilerService.create).to.haveBeenCalledWith(mockAsset, data);
      assert(service['idGenerator_'].generate).to.haveBeenCalledWith([]);
    });
  });
});
