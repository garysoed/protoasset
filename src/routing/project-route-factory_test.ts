import {assert, TestBase} from '../test-base';
TestBase.setup();

import {ProjectRouteFactory} from './project-route-factory';


describe('routing.ProjectRouteFactory', () => {
  let factory: ProjectRouteFactory;

  beforeEach(() => {
    factory = new ProjectRouteFactory();
  });

  describe('create', () => {
    it('should create the correct route', () => {
      let projectId = 'projectId';
      assert(factory.create(projectId).getLocation()).to.equal(`/project/${projectId}`);
    });
  });

  describe('populateMatches', () => {
    it('should create the correct match object', () => {
      let projectId = 'projectId';
      let matches = {
        'projectId': projectId,
      };

      assert(factory.populateMatches(matches)).to.equal({projectId: projectId});
    });
  });
});
