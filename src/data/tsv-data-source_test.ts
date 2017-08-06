import { assert, TestBase } from '../test-base';
TestBase.setup();

import { ImmutableList } from 'external/gs_tools/src/immutable';

import { TsvDataSource } from './tsv-data-source';


describe('data.TsvDataSource', () => {
  describe('getData', () => {
    it('should resolve correctly', async () => {
      const innerData = [
        'a0\tb0\tc0',
        'a1\tb1',
        'a2',
        'a3\tb3',
        'a4\tb4\tc4',
      ].join('\n');
      const mockInnerSource = jasmine.createSpyObj('InnerSource', ['getData']);
      mockInnerSource.getData.and.returnValue(Promise.resolve(innerData));

      const list = await TsvDataSource
          .withSource(mockInnerSource)
          .setStartRow(1)
          .setEndRow(3)
          .getData();
      const dataArray = list.map((list: ImmutableList<string>) => [...list]);
      assert([...dataArray]).to.equal([
        ['a1', 'b1'],
        ['a2'],
        ['a3', 'b3'],
      ]);
    });
  });
});
