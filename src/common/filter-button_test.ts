import { assert, TestBase } from '../test-base';
TestBase.setup();

import { Mocks } from 'external/gs_tools/src/mock';
import { TestDispose } from 'external/gs_tools/src/testing';

import { FilterButton } from './filter-button';


describe('common.FilterButton', () => {
  let button: FilterButton;

  beforeEach(() => {
    button = new FilterButton(Mocks.object('ThemeService'));
    TestDispose.add(button);
  });

  describe('onClearButtonAction_', () => {
    it('should clear the search text value and the filter text attribute', () => {
      spyOn(button['searchTextValueHook_'], 'set');
      spyOn(button['filterTextAttrHook_'], 'set');
      spyOn(button['drawerExpandedHook_'], 'set');

      button['onClearButtonAction_']();

      assert(button['searchTextValueHook_'].set).to.haveBeenCalledWith('');
      assert(button['filterTextAttrHook_'].set).to.haveBeenCalledWith('');
      assert(button['drawerExpandedHook_'].set).to.haveBeenCalledWith(false);
    });
  });

  describe('onSearchButtonAction_', () => {
    it('should expand the drawer if it is collapsed', () => {
      spyOn(button['drawerExpandedHook_'], 'get').and.returnValue(false);
      spyOn(button['drawerExpandedHook_'], 'set');

      button['onSearchButtonAction_']();

      assert(button['drawerExpandedHook_'].set).to.haveBeenCalledWith(true);
    });

    it('should collapse the drawer if it is expanded', () => {
      spyOn(button['drawerExpandedHook_'], 'get').and.returnValue(true);
      spyOn(button['drawerExpandedHook_'], 'set');

      button['onSearchButtonAction_']();

      assert(button['drawerExpandedHook_'].set).to.haveBeenCalledWith(false);
    });
  });

  describe('onSearchTextChange_', () => {
    it('should set the filter text attribute to the value of the search text', () => {
      const searchText = 'searchText';
      spyOn(button['searchTextValueHook_'], 'get').and.returnValue(searchText);
      spyOn(button['filterTextAttrHook_'], 'set');

      button['onSearchTextChange_']();

      assert(button['filterTextAttrHook_'].set).to.haveBeenCalledWith(searchText);
    });

    it('should set the filter text attribute to "" if search text value is null', () => {
      spyOn(button['searchTextValueHook_'], 'get').and.returnValue(null);
      spyOn(button['filterTextAttrHook_'], 'set');

      button['onSearchTextChange_']();

      assert(button['filterTextAttrHook_'].set).to.haveBeenCalledWith('');
    });
  });
});
