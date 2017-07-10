import { assert, TestBase } from '../test-base';
TestBase.setup();

import { TsvDataSource2 } from '../data/tsv-data-source2';

describe('data.TsvDataSource2', () => {
  let mockInnerSource: any;

  beforeEach(() => {
    mockInnerSource = jasmine.createSpyObj('InnerSource', ['getData']);
  });

  describe('getData', () => {
    it('should resolve with the parsed data', async () => {
      const source = new TsvDataSource2(mockInnerSource, 1, 3);
      const innerData = [
        'a0\tb0\tc0',
        'a1\tb1',
        'a2',
        'a3\tb3',
        'a4\tb4\tc4',
      ].join('\n');
      mockInnerSource.getData.and.returnValue(Promise.resolve(innerData));

      const data = await source.getData();
      assert(data.size()).to.equal(3);
      assert(data.get(0)!).to.haveElements(['a1', 'b1']);
      assert(data.get(1)!).to.haveElements(['a2']);
      assert(data.get(2)!).to.haveElements(['a3', 'b3']);
    });
  });
});
