import { assert, TestBase } from '../test-base';
TestBase.setup();

import { Mocks } from 'external/gs_tools/src/mock';

import { CssImportService } from './css-import-service';


describe('common.CssImportService', () => {
  let mockDocument;
  let service: CssImportService;

  beforeEach(() => {
    mockDocument = jasmine.createSpyObj('Document', ['createElement']);
    service = new CssImportService(mockDocument);
  });

  describe('import', () => {
    it('should add the correct style to the head', () => {
      const cssUrl = 'cssUrl';
      const styleEl = Mocks.object('styleEl');
      mockDocument.createElement.and.returnValue(styleEl);

      const mockHead = jasmine.createSpyObj('Head', ['appendChild']);
      mockDocument.head = mockHead;

      service.import(cssUrl);
      assert(service['importedCss_']).to.haveElements([cssUrl]);
      assert(mockHead.appendChild).to.haveBeenCalledWith(styleEl);
      assert(styleEl.innerHTML).to.equal(`@import url('${cssUrl}');`);
      assert(mockDocument.createElement).to.haveBeenCalledWith('style');
    });

    it('should do nothing if the url has been imported', () => {
      const cssUrl = 'cssUrl';
      service['importedCss_'].add(cssUrl);

      service.import(cssUrl);
      assert(service['importedCss_']).to.haveElements([cssUrl]);
      assert(mockDocument.createElement).toNot.haveBeenCalled();
    });
  });
});
