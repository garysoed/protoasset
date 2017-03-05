import { assert, Matchers, TestBase } from '../test-base';
TestBase.setup();

import { Mocks } from 'external/gs_tools/src/mock';
import { TestDispose } from 'external/gs_tools/src/testing';

import { RenderService } from '../render/render-service';


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
          assert(mockIframeEl.src).to.equal('src/render/render-app.html');
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
});
