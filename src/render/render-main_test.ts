import { assert, Matchers, TestBase } from '../test-base';
TestBase.setup();

import { Mocks } from 'external/gs_tools/src/mock';
import { ApiServer, PostMessageChannel } from 'external/gs_tools/src/rpc';
import { TestDispose } from 'external/gs_tools/src/testing';

import { RenderRequestType } from '../data/render-request';
import { RenderMain } from '../render/render-main';


describe('render.RenderMain', () => {
  let mockHtml2Canvas;
  let mockWindow;
  let main: RenderMain;

  beforeEach(() => {
    mockHtml2Canvas = jasmine.createSpy('Html2Canvas');
    mockWindow = jasmine.createSpyObj('Window', ['setTimeout']);
    main = new RenderMain(mockHtml2Canvas, mockWindow);
    TestDispose.add(main);
  });

  describe('getCanvasEl_', () => {
    it('should return the correct canvas element', () => {
      const canvasEl = Mocks.object('canvasEl');
      const mockBody = jasmine.createSpyObj('Body', ['querySelector']);
      mockBody.querySelector.and.returnValue(canvasEl);
      mockWindow.document = {body: mockBody};

      assert(main['getCanvasEl_']()).to.equal(canvasEl);
      assert(mockBody.querySelector).to.haveBeenCalledWith('canvas');
    });
  });

  describe('processRequest_', () => {
    it('should resolve with the response when rendering is complete', async () => {
      const styleEl = Mocks.object('styleEl');
      const mockHead = jasmine.createSpyObj('Head', ['querySelector']);
      mockHead.querySelector.and.returnValue(styleEl);

      const rootStyle = Mocks.object('rootStyle');
      const rootEl = Mocks.object('rootEl');
      rootEl.style = rootStyle;
      const mockBody = jasmine.createSpyObj('Body', ['querySelector']);
      mockBody.querySelector.and.returnValue(rootEl);

      mockWindow.document = {body: mockBody, head: mockHead};
      mockWindow.setTimeout.and.callFake((handler: () => void) => {
        handler();
      });

      const canvas = Mocks.object('canvas');
      mockHtml2Canvas.and.callFake((root: any, options: any) => {
        options.onrendered(canvas);
      });

      const response = Mocks.object('response');
      spyOn(main, 'onRendered_').and.callFake((resolveFn: any) => {
        resolveFn(response);
      });

      const css = 'css';
      const height = 123;
      const html = 'html';
      const width = 456;
      const request = {css, height, html, id: 'id', width};

      assert(await main['processRequest_'](request)).to.equal(response);
      assert(main['onRendered_']).to
          .haveBeenCalledWith(<any> Matchers.any(Function), request, canvas);
      assert(mockHtml2Canvas).to.haveBeenCalledWith(rootEl, {
        onrendered: Matchers.any(Function),
        useCORS: true,
      });
      assert(mockWindow.setTimeout).to.haveBeenCalledWith(Matchers.any(Function), 100);
      assert(rootEl.innerHTML).to.equal(html);
      assert(rootStyle.height).to.equal(`${height}px`);
      assert(rootStyle.width).to.equal(`${width}px`);
      assert(mockBody.querySelector).to.haveBeenCalledWith('div');
      assert(styleEl.innerHTML).to.equal(css);
      assert(mockHead.querySelector).to.haveBeenCalledWith('style');
    });
  });

  describe('onRendered_', () => {
    it('should call the resolve function with the correct URI', () => {
      const uri = 'uri';
      const mockContext = jasmine.createSpyObj('Context', ['drawImage']);
      const mockTargetCanvasEl =
          jasmine.createSpyObj('TargetCanvasEl', ['getContext', 'toDataURL']);
      mockTargetCanvasEl.getContext.and.returnValue(mockContext);
      mockTargetCanvasEl.toDataURL.and.returnValue(uri);
      spyOn(main, 'getCanvasEl_').and.returnValue(mockTargetCanvasEl);

      const canvas = Mocks.object('canvas');
      const height = 123;
      const id = 'id';
      const width = 456;

      const request = Mocks.object('request');
      request.height = height;
      request.id = id;
      request.width = width;

      const mockResolve = jasmine.createSpy('Resolve');

      main['onRendered_'](mockResolve, request, canvas);
      assert(mockResolve).to.haveBeenCalledWith({id, uri});
      assert(mockTargetCanvasEl.toDataURL).to.haveBeenCalledWith('image/png');
      assert(mockContext.drawImage).to.haveBeenCalledWith(canvas, 0, 0, width, height);
      assert(mockTargetCanvasEl.getContext).to.haveBeenCalledWith('2d');
      assert(mockTargetCanvasEl.height).to.equal(height);
      assert(mockTargetCanvasEl.width).to.equal(width);
    });

    it('should throw error if the 2d context cannot be found', () => {
      const mockTargetCanvasEl = jasmine.createSpyObj('TargetCanvasEl', ['getContext']);
      mockTargetCanvasEl.getContext.and.returnValue(null);
      spyOn(main, 'getCanvasEl_').and.returnValue(mockTargetCanvasEl);

      const canvas = Mocks.object('canvas');
      const request = Mocks.object('request');
      const mockResolve = jasmine.createSpy('Resolve');

      assert(() => {
        main['onRendered_'](mockResolve, request, canvas);
      }).to.throwError(/2d context/);
      assert(mockResolve).toNot.haveBeenCalled();
    });
  });

  describe('run', () => {
    it('should create the server and run it correctly', async () => {
      const channel = Mocks.object('channel');
      spyOn(PostMessageChannel, 'listen').and.returnValue(Promise.resolve(channel));

      const origin = 'origin';
      spyOn(PostMessageChannel, 'getOrigin').and.returnValue(origin);

      const mockServer = jasmine.createSpyObj('Server', ['run']);
      const apiServerSpy = spyOn(ApiServer, 'of').and.returnValue(mockServer);
      spyOn(main, 'addDisposable');
      spyOn(main, 'processRequest_');

      await main.run();
      assert(main.addDisposable).to.haveBeenCalledWith(channel);
      assert(mockServer.run).to.haveBeenCalledWith();

      assert(ApiServer.of).to
          .haveBeenCalledWith(channel, <any> Matchers.any(Function), RenderRequestType);
      const request = Mocks.object('request');
      apiServerSpy.calls.argsFor(0)[1](request);
      assert(main['processRequest_']).to.haveBeenCalledWith(request);

      assert(PostMessageChannel.listen).to.haveBeenCalledWith(mockWindow, origin);
      assert(PostMessageChannel.getOrigin).to.haveBeenCalledWith(mockWindow);
    });
  });
});
