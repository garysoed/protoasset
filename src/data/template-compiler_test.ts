import { assert, TestBase } from '../test-base';
TestBase.setup();

import { Mocks } from 'external/gs_tools/src/mock';

import { TemplateCompiler } from './template-compiler';


describe('data.TemplateCompiler', () => {
  let assetData;
  let mockHandlebars;
  let compiler: TemplateCompiler;

  beforeEach(() => {
    assetData = Mocks.object('assetData');
    mockHandlebars = jasmine.createSpyObj('Handlebars', ['compile']);
    compiler = new TemplateCompiler(assetData, mockHandlebars);
  });

  describe('compile', () => {
    it('should return a function that produces the correct string', () => {
      const extraKey1 = 'extraKey1';
      const extraData1 = Mocks.object('extraData1');

      const extraKey2 = 'extraKey2';
      const extraData2 = Mocks.object('extraData2');

      const additionalData = {[extraKey1]: extraData1, [extraKey2]: extraData2};

      const result = 'result';
      const mockDelegate = jasmine.createSpy('Delegate');
      mockDelegate.and.returnValue(result);
      mockHandlebars.compile.and.returnValue(mockDelegate);

      const template = 'template';

      assert(compiler.compile(template, additionalData)).to.equal(result);
      assert(mockHandlebars.compile).to.haveBeenCalledWith(template);
      assert(mockDelegate).to.haveBeenCalledWith({
        $$: assetData,
        [extraKey1]: extraData1,
        [extraKey2]: extraData2,
      });
    });
  });
});
