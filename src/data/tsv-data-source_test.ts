import {assert, TestBase} from '../test-base';
TestBase.setup();

import {Mocks} from 'external/gs_tools/src/mock';

import {TsvDataSource} from './tsv-data-source';


describe('data.TsvDataSource', () => {
  let mockInnerSource;
  let source: TsvDataSource;

  beforeEach(() => {
    mockInnerSource = jasmine.createSpyObj('InnerSource', ['getData']);
    source = new TsvDataSource(mockInnerSource, 0, 2);
  });

  describe('parseData_', () => {
    it('should parse the data correctly', () => {
      source['startRow_'] = 1;
      source['endRow_'] = 3;
      let data = [
        'a0\tb0\tc0',
        'a1\tb1',
        'a2',
        'a3\tb3',
        'a4\tb4\tc4',
      ].join('\n');
      assert(source['parseData_'](data)).to.equal([
        ['a1', 'b1'],
        ['a2'],
        ['a3', 'b3'],
      ]);
    });
  });

  describe('getData', () => {
    it('should resolve with the parsed data', (done: any) => {
      let parsedData = Mocks.object('parsedData');
      spyOn(source, 'parseData_').and.returnValue(parsedData);

      let innerData = 'innerData';
      mockInnerSource.getData.and.returnValue(Promise.resolve(innerData));

      source
          .getData()
          .then((actualData: string[][]) => {
            assert(actualData).to.equal(parsedData);
            assert(source['cachedInnerSourceData_']).to.equal(innerData);
            assert(source['cache_']).to.equal(parsedData);
            assert(source['parseData_']).to.haveBeenCalledWith(innerData);
            done();
          }, done.fail);
    });

    it('should use the cache if available and the inner data has not changed', (done: any) => {
      let cachedData = Mocks.object('cachedData');
      source['cache_'] = cachedData;

      spyOn(source, 'parseData_');

      let innerData = 'innerData';
      source['cachedInnerSourceData_'] = innerData;
      mockInnerSource.getData.and.returnValue(Promise.resolve(innerData));

      source
          .getData()
          .then((actualData: string[][]) => {
            assert(actualData).to.equal(cachedData);
            assert(source['parseData_']).toNot.haveBeenCalled();
            done();
          }, done.fail);
    });

    it('should not use the cache if inner data has been changed', (done: any) => {
      let cachedData = Mocks.object('cachedData');
      source['cache_'] = cachedData;

      let parsedData = Mocks.object('parsedData');
      spyOn(source, 'parseData_').and.returnValue(parsedData);

      let innerData = 'innerData';
      source['cachedInnerSourceData_'] = 'oldInnerData';
      mockInnerSource.getData.and.returnValue(Promise.resolve(innerData));

      source
          .getData()
          .then((actualData: string[][]) => {
            assert(actualData).to.equal(parsedData);
            assert(source['cachedInnerSourceData_']).to.equal(innerData);
            assert(source['cache_']).to.equal(parsedData);
            assert(source['parseData_']).to.haveBeenCalledWith(innerData);
            done();
          }, done.fail);
    });
  });
});
