import {assert, TestBase} from '../test-base';
TestBase.setup();

import {CreateAssetRouteFactory} from './create-asset-route-factory';


describe('routing.CreateAssetRouteFactory', () => {
  let factory: CreateAssetRouteFactory;

  beforeEach(() => {
    factory = new CreateAssetRouteFactory();
  });

  describe('create', () => {
    it('should return the correct route', () => {
      let projectId = 'projectId';
      let route = factory.create(projectId);
      assert(route.getLocation()).to.equal(`/project/${projectId}/create`);
    });
  });

  describe('populateMatches', () => {
    it('should return the correct match object', () => {
      let projectId = 'projectId';
      assert(factory.populateMatches({'projectId': projectId})).to.equal({
        projectId: projectId,
      });
    });
  });
});
