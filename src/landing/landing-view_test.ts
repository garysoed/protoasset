import {assert, Matchers, TestBase} from '../test-base';
TestBase.setup();

import {DisposableFunction} from 'external/gs_tools/src/dispose';
import {LocationServiceEvents} from 'external/gs_tools/src/ui';
import {Mocks} from 'external/gs_tools/src/mock';
import {TestDispose} from 'external/gs_tools/src/testing';


import {LandingView} from './landing-view';


describe('landing.LandingView', () => {
  let view: LandingView;
  let mockLocationService;
  let mockProjectCollection;

  beforeEach(() => {
    mockLocationService = jasmine.createSpyObj('LocationService', ['goTo', 'hasMatch', 'on']);
    mockProjectCollection = jasmine.createSpyObj('ProjectCollection', ['list']);
    view = new LandingView(mockLocationService, mockProjectCollection);
    TestDispose.add(view);
  });

  describe('onLocationChanged_', () => {
    it('should redirect to create page if the new location is landing but there are no projects',
        (done: any) => {
          mockLocationService.hasMatch.and.returnValue(true);
          mockProjectCollection.list.and.returnValue(Promise.resolve([]));

          view['onLocationChanged_']()
              .then(() => {
                assert(mockLocationService.goTo).to.haveBeenCalledWith('/create');
                assert(mockLocationService.hasMatch).to.haveBeenCalledWith('/$');
                done();
              }, done.fail);
        });

    it('should not redirect if the new location is landing but there are projects',
        (done: any) => {
          mockLocationService.hasMatch.and.returnValue(true);
          mockProjectCollection.list.and.returnValue(Promise.resolve([Mocks.object('project')]));

          view['onLocationChanged_']()
              .then(() => {
                assert(mockLocationService.goTo).toNot.haveBeenCalled();
                done();
              }, done.fail);
        });

    it('should not redirect if the new location is not landing', (done: any) => {
      mockLocationService.hasMatch.and.returnValue(false);
      mockProjectCollection.list.and.returnValue(Promise.resolve([]));

      view['onLocationChanged_']()
          .then(() => {
            assert(mockLocationService.goTo).toNot.haveBeenCalled();
            assert(mockLocationService.hasMatch).to.haveBeenCalledWith('/$');
            done();
          }, done.fail);
    });
  });

  describe('onCreated', () => {
    it('should initialize correctly', () => {
      let locationChangedSpy = spyOn(view, 'onLocationChanged_');
      mockLocationService.on.and.returnValue(DisposableFunction.of(() => {}));

      view.onCreated(Mocks.object('element'));
      assert(view['onLocationChanged_']).to.haveBeenCalledWith();

      assert(mockLocationService.on).to.haveBeenCalledWith(
          LocationServiceEvents.CHANGED,
          Matchers.any(Function));
      locationChangedSpy.calls.reset();
      mockLocationService.on.calls.argsFor(0)[1]();
      assert(view['onLocationChanged_']).to.haveBeenCalledWith();
    });
  });
});
