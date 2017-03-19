import { assert, TestBase } from '../test-base';
TestBase.setup();

import { DomEvent, ListenableDom } from 'external/gs_tools/src/event';
import { Mocks } from 'external/gs_tools/src/mock';
import { TestDispose } from 'external/gs_tools/src/testing';

import { RESULTS_DATA_HELPER, SampleDataPicker } from './sample-data-picker';


describe('RESULTS_DATA_HELPER', () => {
  describe('create', () => {
    it('should return the correct element', () => {
      const mockClassList = jasmine.createSpyObj('ClassList', ['add']);
      const element = Mocks.object('element');
      element.classList = mockClassList;

      const disposableFunction = Mocks.object('disposableFunction');
      const mockListenableElement = jasmine.createSpyObj('ListenableElement', ['on']);
      mockListenableElement.on.and.returnValue(disposableFunction);
      spyOn(ListenableDom, 'of').and.returnValue(mockListenableElement);

      const mockDocument = jasmine.createSpyObj('Document', ['createElement']);
      mockDocument.createElement.and.returnValue(element);

      const mockInstance = jasmine.createSpyObj('Instance', ['addDisposable', 'onResultClick_']);

      assert(RESULTS_DATA_HELPER.create(mockDocument, mockInstance)).to.equal(element);
      assert(mockInstance.addDisposable).to.haveBeenCalledWith(mockListenableElement);
      assert(mockInstance.addDisposable).to.haveBeenCalledWith(disposableFunction);
      assert(mockListenableElement.on).to
          .haveBeenCalledWith(DomEvent.CLICK, mockInstance.onResultClick_, mockInstance);
      assert(ListenableDom.of).to.haveBeenCalledWith(element);
      assert(mockClassList.add).to.haveBeenCalledWith('result');
      assert(mockDocument.createElement).to.haveBeenCalledWith('div');
    });
  });

  describe('get', () => {
    it('should return the correct data', () => {
      const row = 123;
      const display = 'display';
      const mockElement = jasmine.createSpyObj('Element', ['getAttribute']);
      mockElement.getAttribute.and.callFake((query: string) => {
        switch (query) {
          case 'gs-display':
            return display;
          case 'gs-row':
            return `${row}`;
        }
      });
      assert(RESULTS_DATA_HELPER.get(mockElement)).to.equal({display, row});
    });

    it('should return null if the display is null', () => {
      const row = 123;
      const mockElement = jasmine.createSpyObj('Element', ['getAttribute']);
      mockElement.getAttribute.and.callFake((query: string) => {
        switch (query) {
          case 'gs-display':
            return null;
          case 'gs-row':
            return `${row}`;
        }
      });
      assert(RESULTS_DATA_HELPER.get(mockElement)).to.beNull();
    });

    it('should return null if the row is NaN', () => {
      const display = 'display';
      const mockElement = jasmine.createSpyObj('Element', ['getAttribute']);
      mockElement.getAttribute.and.callFake((query: string) => {
        switch (query) {
          case 'gs-display':
            return display;
          case 'gs-row':
            return NaN;
        }
      });
      assert(RESULTS_DATA_HELPER.get(mockElement)).to.beNull();
    });
  });

  describe('set', () => {
    it('should set the attribute, class, inner text correctly', () => {
      const style = Mocks.object('style');
      const mockElement = jasmine.createSpyObj('Element', ['setAttribute']);
      mockElement.style = style;

      const row = 123;
      const displayText = 'displayText';
      const data = {display: displayText, row};

      RESULTS_DATA_HELPER.set(data, mockElement, Mocks.object('instance'));
      assert(mockElement.setAttribute).to.haveBeenCalledWith('gs-display', displayText);
      assert(mockElement.setAttribute).to.haveBeenCalledWith('gs-row', `${row}`);
      assert(mockElement.innerText).to.equal(displayText);
      assert(style.display).to.equal('');
    });

    it('should hide the element if there are no display strings', () => {
      const style = Mocks.object('style');
      const mockElement = jasmine.createSpyObj('Element', ['setAttribute']);
      mockElement.style = style;

      const data = {display: '', row: 123};

      RESULTS_DATA_HELPER.set(data, mockElement, Mocks.object('instance'));
      assert(style.display).to.equal('none');
    });
  });
});


describe('common.SampleDataPicker', () => {
  let mockSampleDataService;
  let picker: SampleDataPicker;

  beforeEach(() => {
    mockSampleDataService = jasmine.createSpyObj('SampleDataService', ['getFuse', 'setDataRow']);
    picker = new SampleDataPicker(
        mockSampleDataService,
        Mocks.object('ThemeService'));
    TestDispose.add(picker);
  });

  describe('getFuse_', () => {
    it('should return fuse promise from the sample data service', () => {
      const fusePromise = Mocks.object('fusePromise');
      mockSampleDataService.getFuse.and.returnValue(fusePromise);
      assert(picker['getFuse_']()).to.equal(fusePromise);
      assert(picker['fusePromise_']).to.equal(fusePromise);
    });

    it('should return the cached fuse promise', () => {
      const cachedFusePromise = Mocks.object('cachedFusePromise');
      picker['fusePromise_'] = cachedFusePromise;
      assert(picker['getFuse_']()).to.equal(cachedFusePromise);
      assert(mockSampleDataService.getFuse).toNot.haveBeenCalled();
    });
  });

  describe('onResultClick_', () => {
    it('should set the data row and the search text correctly', () => {
      const dataRow = 123;
      const display = 'display';
      const mockTarget = jasmine.createSpyObj('Target', ['getAttribute']);
      mockTarget.getAttribute.and.callFake((attribute: string) => {
        switch (attribute) {
          case 'gs-row':
            return `${dataRow}`;
          case 'gs-display':
            return display;
        }
      });
      spyOn(picker.searchTextValueHook_, 'set');

      const event = Mocks.object('event');
      event.target = mockTarget;
      picker.onResultClick_(event);
      assert(picker.searchTextValueHook_.set).to.haveBeenCalledWith(display);
      assert(mockTarget.getAttribute).to.haveBeenCalledWith('gs-display');
      assert(mockSampleDataService.setDataRow).to.haveBeenCalledWith(dataRow);
      assert(mockTarget.getAttribute).to.haveBeenCalledWith('gs-row');
    });

    it('should do nothing if there are no data rows in the target', () => {
      const mockTarget = jasmine.createSpyObj('Target', ['getAttribute']);
      mockTarget.getAttribute.and.returnValue(null);
      spyOn(picker.searchTextValueHook_, 'set');

      const event = Mocks.object('event');
      event.target = mockTarget;
      picker.onResultClick_(event);
      assert(picker.searchTextValueHook_.set).toNot.haveBeenCalled();
      assert(mockSampleDataService.setDataRow).toNot.haveBeenCalled();
    });
  });

  describe('onSearchButtonClick_', () => {
    it('should toggle the drawer expansion', () => {
      spyOn(picker.drawerExpandedHook_, 'get').and.returnValue(false);
      spyOn(picker.drawerExpandedHook_, 'set');

      picker['fusePromise_'] = Mocks.object('fusePromise');
      spyOn(picker, 'updateResults_');

      picker.onSearchButtonClick_();
      assert(picker['updateResults_']).to.haveBeenCalledWith();
      assert(picker['fusePromise_']).to.beNull();
      assert(picker.drawerExpandedHook_.set).to.haveBeenCalledWith(true);
    });

    it('should not clear the fuse cache or update the results if the drawer should be collapsed',
        () => {
          spyOn(picker.drawerExpandedHook_, 'get').and.returnValue(true);
          spyOn(picker.drawerExpandedHook_, 'set');

          const cachedFuse = Mocks.object('cachedFuse');
          picker['fusePromise_'] = cachedFuse;
          spyOn(picker, 'updateResults_');

          picker.onSearchButtonClick_();
          assert(picker['updateResults_']).toNot.haveBeenCalled();
          assert(picker['fusePromise_']).to.equal(cachedFuse);
          assert(picker.drawerExpandedHook_.set).to.haveBeenCalledWith(false);
        });
  });

  describe('updateResults_', () => {
    it('should set the results children correctly', async (done: any) => {
      const searchText = 'searchText';
      spyOn(picker.searchTextValueHook_, 'get').and.returnValue(searchText);

      const display0 = 'display0';
      const row0 = 120;
      const display1 = 'display1';
      const row1 = 121;
      const display2 = 'display2';
      const row2 = 122;
      const display3 = 'display3';
      const row3 = 123;
      const display4 = 'display4';
      const row4 = 124;
      const mockFuse = jasmine.createSpyObj('Fuse', ['search']);
      mockFuse.search.and.returnValue([
        {item: {display: display0, row: row0}},
        {item: {display: display1, row: row1}},
        {item: {display: display2, row: row2}},
        {item: {display: display3, row: row3}},
        {item: {display: display4, row: row4}},
        Mocks.object('discardedResult1'),
        Mocks.object('discardedResult2'),
      ]);
      spyOn(picker, 'getFuse_').and.returnValue(Promise.resolve(mockFuse));

      spyOn(picker.resultsChildrenHook_, 'set');

      await picker.updateResults_();
      assert(picker.resultsChildrenHook_.set).to.haveBeenCalledWith([
        {display: display0, row: row0},
        {display: display1, row: row1},
        {display: display2, row: row2},
        {display: display3, row: row3},
        {display: display4, row: row4},
      ]);
      assert(mockFuse.search).to.haveBeenCalledWith(searchText);
    });

    it('should do nothing if the fuse object is null', async (done: any) => {
      const searchText = 'searchText';
      spyOn(picker.searchTextValueHook_, 'get').and.returnValue(searchText);
      spyOn(picker, 'getFuse_').and.returnValue(Promise.resolve(null));

      spyOn(picker.resultsChildrenHook_, 'set');

      await picker.updateResults_();
      assert(picker.resultsChildrenHook_.set).toNot.haveBeenCalled();
    });

    it('should do nothing if search text is null', async (done: any) => {
      spyOn(picker.searchTextValueHook_, 'get').and.returnValue(null);
      spyOn(picker.resultsChildrenHook_, 'set');

      await picker.updateResults_();
      assert(picker.resultsChildrenHook_.set).toNot.haveBeenCalled();
    });
  });
});
