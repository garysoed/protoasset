import { assert, Matchers, Mocks, TestBase } from '../test-base';
TestBase.setup();

import { ImmutableSet } from 'external/gs_tools/src/immutable';

import { FuseSearcher } from '../data/fuse-searcher';


describe('data.FuseSearcher', () => {
  let searcher: FuseSearcher<any, any>;

  beforeEach(() => {
    searcher = new FuseSearcher();
  });

  describe('index', () => {
    it(`should create the fuse object correctly`, async () => {
      const index1 = Mocks.object('index1');
      const index2 = Mocks.object('index2');
      const mockItem1 = jasmine.createSpyObj('Item1', ['getSearchIndex']);
      mockItem1.getSearchIndex.and.returnValue(index1);
      const mockItem2 = jasmine.createSpyObj('Item2', ['getSearchIndex']);
      mockItem2.getSearchIndex.and.returnValue(index2);

      const fuse = Mocks.object('fuse');
      const createFuseSpy = spyOn(searcher, 'createFuse_').and.returnValue(fuse);

      searcher.index(Promise.resolve(ImmutableSet.of([mockItem1, mockItem2])));

      assert(await searcher['fusePromise_']).to.equal(fuse);
      assert(searcher['createFuse_']).to.haveBeenCalledWith(Matchers.any(ImmutableSet));
      assert(createFuseSpy.calls.argsFor(0)[0] as ImmutableSet<any>)
          .to.haveElements([index1, index2]);
    });
  });

  describe('search', () => {
    it(`should return the correct results`, async () => {
      const token = 'token';
      const item1 = Mocks.object('item1');
      const item2 = Mocks.object('item2');
      const mockFuse = jasmine.createSpyObj('Fuse', ['search']);
      mockFuse.search.and.returnValue([{this: item1}, {this: item2}]);
      searcher['fusePromise_'] = mockFuse;

      assert(await searcher.search(token)).to.haveElements([item1, item2]);
      assert(mockFuse.search).to.haveBeenCalledWith(token);
    });

    it(`should return empty array if there are no indexes`, async () => {
      assert(await searcher.search('token')).to.haveElements([]);
    });
  });
});
