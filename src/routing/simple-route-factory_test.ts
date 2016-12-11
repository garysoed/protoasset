import {assert, TestBase} from '../test-base';
TestBase.setup();

import {SimpleRouteFactory} from './simple-route-factory';


describe('routing.SimpleRouteFactory', () => {
  const LOCATION = 'LOCATION';
  let factory: SimpleRouteFactory;

  beforeEach(() => {
    factory = new SimpleRouteFactory(LOCATION);
  });

  describe('create', () => {
    it('should create a new route object correctly', () => {
      let route = factory.create();
      assert(route.getLocation()).to.equal(LOCATION);
    });
  });

  describe('getMatcher', () => {
    it('should return the correct matcher', () => {
      assert(factory.getMatcher()).to.equal(`${LOCATION}$`);
    });
  });
});
