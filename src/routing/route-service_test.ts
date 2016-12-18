import {assert, TestBase} from '../test-base';
TestBase.setup();

import {Mocks} from 'external/gs_tools/src/mock';
import {TestDispose} from 'external/gs_tools/src/testing';
import {Reflect} from 'external/gs_tools/src/util';

import {LocationServiceEvents} from 'external/gs_tools/src/ui';

import {RouteService} from './route-service';
import {RouteServiceEvents} from './route-service-events';


describe('routing.RouteService', () => {
  let mockLocationService;
  let service: RouteService;

  beforeEach(() => {
    mockLocationService = Mocks.listenable('LocationService');
    mockLocationService.getMatches = jasmine.createSpy('LocationService.getMatches');
    service = new RouteService(mockLocationService);
    TestDispose.add(mockLocationService, service);
  });

  describe('onLocationChanged_', () => {
    it('should dispatch the CHANGED event', () => {
      spyOn(service, 'dispatch');
      service['onLocationChanged_']();
      assert(service.dispatch).to.haveBeenCalledWith(RouteServiceEvents.CHANGED);
    });
  });

  describe('[Reflect.__initialize]', () => {
    it('should listen to the CHANGED event on the location service', () => {
      spyOn(mockLocationService, 'on').and.callThrough();

      service[Reflect.__initialize]();

      assert(mockLocationService.on).to.haveBeenCalledWith(
          LocationServiceEvents.CHANGED,
          service['onLocationChanged_'],
          service);
    });
  });

  describe('getMatches', () => {
    it('should return the correct matches', () => {
      let matcher = 'matcher';
      let populatedMatches = Mocks.object('populatedMatches');
      let mockRouteFactory =
          jasmine.createSpyObj('RouteFactory', ['getMatcher', 'populateMatches']);
      mockRouteFactory.getMatcher.and.returnValue(matcher);
      mockRouteFactory.populateMatches.and.returnValue(populatedMatches);

      let matches = Mocks.object('matches');
      mockLocationService.getMatches.and.returnValue(matches);

      assert(service.getMatches(mockRouteFactory)).to.equal(populatedMatches);
      assert(mockRouteFactory.populateMatches).to.haveBeenCalledWith(matches);
      assert(mockLocationService.getMatches).to.haveBeenCalledWith(matcher);
    });

    it('should return null if there are no matches', () => {
      let matcher = 'matcher';
      let mockRouteFactory = jasmine.createSpyObj('RouteFactory', ['getMatcher']);
      mockRouteFactory.getMatcher.and.returnValue(matcher);

      mockLocationService.getMatches.and.returnValue(null);

      assert(service.getMatches(mockRouteFactory)).to.equal(null);
      assert(mockLocationService.getMatches).to.haveBeenCalledWith(matcher);
    });
  });

  describe('goTo', () => {
    it('should go to the correct location', () => {
      mockLocationService.goTo = jasmine.createSpy('LocationService#goTo');

      let location = 'location';
      let mockRoute = jasmine.createSpyObj('Route', ['getLocation']);
      mockRoute.getLocation.and.returnValue(location);

      service.goTo(mockRoute);

      assert(mockLocationService.goTo).to.haveBeenCalledWith(location);
    });
  });

  describe('isDisplayed', () => {
    it('should return true if the location service has a match', () => {
      let matcher = 'matcher';
      let mockRouteFactory = jasmine.createSpyObj('RouteFactory', ['getMatcher']);
      mockRouteFactory.getMatcher.and.returnValue(matcher);

      mockLocationService.hasMatch = jasmine.createSpy('LocationService#hasMatch');
      mockLocationService.hasMatch.and.returnValue(true);

      assert(service.isDisplayed(mockRouteFactory)).to.beTrue();
      assert(mockLocationService.hasMatch).to.haveBeenCalledWith(matcher);
    });

    it('should return false if the location service does not have a match', () => {
      let matcher = 'matcher';
      let mockRouteFactory = jasmine.createSpyObj('RouteFactory', ['getMatcher']);
      mockRouteFactory.getMatcher.and.returnValue(matcher);

      mockLocationService.hasMatch = jasmine.createSpy('LocationService#hasMatch');
      mockLocationService.hasMatch.and.returnValue(false);

      assert(service.isDisplayed(mockRouteFactory)).to.beFalse();
      assert(mockLocationService.hasMatch).to.haveBeenCalledWith(matcher);
    });
  });
});
