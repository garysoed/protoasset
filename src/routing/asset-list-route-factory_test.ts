import {assert, TestBase} from '../test-base';
TestBase.setup();

import {Mocks} from 'external/gs_tools/src/mock';

import {AssetListRouteFactory} from './asset-list-route-factory';


describe('routing.AssetListRouteFactory', () => {
  let mockProjectCollection: any;
  let factory: AssetListRouteFactory;

  beforeEach(() => {
    mockProjectCollection = jasmine.createSpyObj('ProjectCollection', ['get']);
    factory = new AssetListRouteFactory(
        mockProjectCollection,
        Mocks.object('parent'));
  });

  describe('getRelativePath_', () => {
    it('should return the correct path', () => {
      let projectId = 'projectId';
      assert(factory['getRelativePath_']({projectId: projectId})).to
          .equal(`/project/${projectId}`);
    });
  });

  describe('getRelativeMatchParams_', () => {
    it('should return the correct params', () => {
      let projectId = 'projectId';
      assert(factory['getRelativeMatchParams_']({'projectId': projectId})).to.equal({
        projectId: projectId,
      });
    });
  });

  describe('getName', () => {
    it('should return the correct name', (done: any) => {
      let name = 'name';
      let mockProject = jasmine.createSpyObj('Project', ['getName']);
      mockProject.getName.and.returnValue(name);
      mockProjectCollection.get.and.returnValue(Promise.resolve(mockProject));

      let projectId = 'projectId';

      factory
          .getName({projectId: projectId})
          .then((actualName: string) => {
            assert(actualName).to.equal(name);
            assert(mockProjectCollection.get).to.haveBeenCalledWith(projectId);
            done();
          }, done.fail);
    });

    it('should return the project ID if the project is unknown', (done: any) => {
      mockProjectCollection.get.and.returnValue(Promise.resolve(null));

      let projectId = 'projectId';
      factory
          .getName({projectId: projectId})
          .then((actualName: string) => {
            assert(actualName).to.equal(`Unknown project ${projectId}`);
            done();
          }, done.fail);
    });
  });
});
