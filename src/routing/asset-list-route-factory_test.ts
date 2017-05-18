import { assert, TestBase } from '../test-base';
TestBase.setup();

import { ImmutableMap } from 'external/gs_tools/src/immutable';
import { Mocks } from 'external/gs_tools/src/mock';

import { AssetListRouteFactory } from './asset-list-route-factory';


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
      const projectId = 'projectId';
      assert(factory['getRelativePath_']({projectId: projectId})).to
          .equal(`/project/${projectId}`);
    });
  });

  describe('getRelativeMatchParams_', () => {
    it('should return the correct params', () => {
      const projectId = 'projectId';
      assert(factory['getRelativeMatchParams_'](ImmutableMap.of([['projectId', projectId]])))
          .to.equal({projectId: projectId});
    });

    it('should throw error if projectId is not found', () => {
      assert(() => {
        factory['getRelativeMatchParams_'](ImmutableMap.of([[]]));
      }).to.throwError(/for project Id/);
    });
  });

  describe('getName', () => {
    it('should return the correct name', async () => {
      const name = 'name';
      const mockProject = jasmine.createSpyObj('Project', ['getName']);
      mockProject.getName.and.returnValue(name);
      mockProjectCollection.get.and.returnValue(Promise.resolve(mockProject));

      const projectId = 'projectId';

      const actualName = await factory.getName({projectId: projectId});
      assert(actualName).to.equal(name);
      assert(mockProjectCollection.get).to.haveBeenCalledWith(projectId);
    });

    it('should return the project ID if the project is unknown', async () => {
      mockProjectCollection.get.and.returnValue(Promise.resolve(null));

      const projectId = 'projectId';
      const actualName = await factory.getName({projectId: projectId});
      assert(actualName).to.equal(`Unknown project ${projectId}`);
    });
  });
});
