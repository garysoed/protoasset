import {assert, TestBase} from '../test-base';
TestBase.setup();

import {Mocks} from 'external/gs_tools/src/mock';

import {TemplateCompiler} from './template-compiler';
import {TemplateCompilerService} from './template-compiler-service';


describe('data.TemplateCompilerService', () => {
  let mockHandlebars;
  let service: TemplateCompilerService;

  beforeEach(() => {
    mockHandlebars = jasmine.createSpyObj('Handlebars', ['create']);
    service = new TemplateCompilerService(mockHandlebars);
  });

  describe('create', () => {
    it('should create the compiler correctly', (done: any) => {
      let mockHandlebarsInstance = jasmine.createSpyObj('HandlebarsInstance', ['registerHelper']);
      mockHandlebars.create.and.returnValue(mockHandlebarsInstance);

      let name1 = 'name1';
      let function1 = Mocks.object('function1');
      let mockHelper1 = jasmine.createSpyObj('Helper1', ['asFunction', 'getName']);
      mockHelper1.asFunction.and.returnValue(function1);
      mockHelper1.getName.and.returnValue(name1);

      let name2 = 'name2';
      let function2 = Mocks.object('function2');
      let mockHelper2 = jasmine.createSpyObj('Helper2', ['asFunction', 'getName']);
      mockHelper2.asFunction.and.returnValue(function2);
      mockHelper2.getName.and.returnValue(name2);

      let dataValue = Mocks.object('dataValue');
      let mockData = jasmine.createSpyObj('Data', ['getData']);
      mockData.getData.and.returnValue(Promise.resolve(dataValue));

      let mockAsset = jasmine.createSpyObj('Asset', ['getData', 'getHelpers']);
      mockAsset.getData.and.returnValue(mockData);
      mockAsset.getHelpers.and.returnValue([mockHelper1, mockHelper2]);

      let compiler = Mocks.object('compiler');
      spyOn(TemplateCompiler, 'of').and.returnValue(compiler);

      service
          .create(mockAsset)
          .then((actualCompiler: any) => {
            assert(actualCompiler).to.equal(compiler);
            assert(TemplateCompiler.of).to.haveBeenCalledWith(dataValue, mockHandlebarsInstance);
            assert(mockHandlebarsInstance.registerHelper).to.haveBeenCalledWith(name1, function1);
            assert(mockHandlebarsInstance.registerHelper).to.haveBeenCalledWith(name2, function2);
            done();
          }, done.fail);
    });

    it('should resolve with null if data cannot be found', (done: any) => {
      let mockHandlebarsInstance = jasmine.createSpyObj('HandlebarsInstance', ['registerHelper']);
      mockHandlebars.create.and.returnValue(mockHandlebarsInstance);

      let mockAsset = jasmine.createSpyObj('Asset', ['getData', 'getHelpers']);
      mockAsset.getData.and.returnValue(null);

      service
          .create(mockAsset)
          .then((actualCompiler: any) => {
            assert(actualCompiler).to.equal(null);
            done();
          }, done.fail);
    });
  });
});
