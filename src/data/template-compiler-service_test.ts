import { assert, TestBase } from '../test-base';
TestBase.setup();

import { Mocks } from 'external/gs_tools/src/mock';

import { BuiltInHelpers } from './built-in-helpers';
import { TemplateCompiler } from './template-compiler';
import { TemplateCompilerService } from './template-compiler-service';


describe('data.TemplateCompilerService', () => {
  let mockHandlebars: any;
  let service: TemplateCompilerService;

  beforeEach(() => {
    mockHandlebars = jasmine.createSpyObj('Handlebars', ['create']);
    service = new TemplateCompilerService(mockHandlebars);
  });

  describe('create', () => {
    it('should create the compiler correctly', async () => {
      const mockHandlebarsInstance = jasmine.createSpyObj('HandlebarsInstance', ['registerHelper']);
      mockHandlebars.create.and.returnValue(mockHandlebarsInstance);

      const name1 = 'name1';
      const function1 = Mocks.object('function1');
      const mockHelper1 = jasmine.createSpyObj('Helper1', ['asFunction', 'getName']);
      mockHelper1.asFunction.and.returnValue(function1);
      mockHelper1.getName.and.returnValue(name1);

      const name2 = 'name2';
      const function2 = Mocks.object('function2');
      const mockHelper2 = jasmine.createSpyObj('Helper2', ['asFunction', 'getName']);
      mockHelper2.asFunction.and.returnValue(function2);
      mockHelper2.getName.and.returnValue(name2);

      const dataValue = Mocks.object('dataValue');

      const mockAsset = jasmine.createSpyObj('Asset', ['getAllHelpers']);
      mockAsset.getAllHelpers.and.returnValue([mockHelper1, mockHelper2]);

      const compiler = Mocks.object('compiler');
      spyOn(TemplateCompiler, 'of').and.returnValue(compiler);

      const actualCompiler = await service.create(mockAsset, dataValue);
      assert(actualCompiler).to.equal(compiler);
      assert(TemplateCompiler.of).to.haveBeenCalledWith(dataValue, mockHandlebarsInstance);
      assert(mockHandlebarsInstance.registerHelper).to.haveBeenCalledWith(name1, function1);
      assert(mockHandlebarsInstance.registerHelper).to.haveBeenCalledWith(name2, function2);
      assert(mockHandlebarsInstance.registerHelper).to
          .haveBeenCalledWith('case', BuiltInHelpers.case);
      assert(mockHandlebarsInstance.registerHelper).to
          .haveBeenCalledWith('ifeq', BuiltInHelpers.ifeq);
    });
  });
});
