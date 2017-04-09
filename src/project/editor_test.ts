import { assert, TestBase } from '../test-base';
TestBase.setup();

import { Editor } from '../project/editor';
import { Mocks } from 'external/gs_tools/src/mock';
import { TestDispose } from 'external/gs_tools/src/testing';


describe('project.Editor', () => {
  let editor: Editor;

  beforeEach(() => {
    editor = new Editor(Mocks.object('ThemeService'));
    TestDispose.add(editor);
  });

  describe('onEditorValueChanged_', () => {
    it('should update the project name', () => {
      const editorValue = 'editorValue';
      spyOn(editor.editorValueHook_, 'get').and.returnValue(editorValue);
      spyOn(editor.projectNameHook_, 'get').and.returnValue(null);
      spyOn(editor.projectNameHook_, 'set');
      editor.onEditorValueChanged_();
      assert(editor.projectNameHook_.set).to.haveBeenCalledWith(editorValue);
    });

    it('should not update the project name if they are the same', () => {
      const editorValue = 'editorValue';
      spyOn(editor.editorValueHook_, 'get').and.returnValue(editorValue);
      spyOn(editor.projectNameHook_, 'get').and.returnValue(editorValue);
      spyOn(editor.projectNameHook_, 'set');
      editor.onEditorValueChanged_();
      assert(editor.projectNameHook_.set).toNot.haveBeenCalled();
    });

    it('should not update the project name if editor value is null', () => {
      spyOn(editor.editorValueHook_, 'get').and.returnValue(null);
      spyOn(editor.projectNameHook_, 'get').and.returnValue('oldValue');
      spyOn(editor.projectNameHook_, 'set');
      editor.onEditorValueChanged_();
      assert(editor.projectNameHook_.set).toNot.haveBeenCalled();
    });
  });

  describe('onProjectNameChanged_', () => {
    it('should update the editor value', () => {
      const projectName = 'projectName';
      spyOn(editor.projectNameHook_, 'get').and.returnValue(projectName);
      spyOn(editor.editorValueHook_, 'get').and.returnValue(null);
      spyOn(editor.editorValueHook_, 'set');
      editor.onProjectNameChanged_();
      assert(editor.editorValueHook_.set).to.haveBeenCalledWith(projectName);
    });

    it('should not update the editor value if they are the same', () => {
      const projectName = 'projectName';
      spyOn(editor.projectNameHook_, 'get').and.returnValue(projectName);
      spyOn(editor.editorValueHook_, 'get').and.returnValue(projectName);
      spyOn(editor.editorValueHook_, 'set');
      editor.onProjectNameChanged_();
      assert(editor.editorValueHook_.set).toNot.haveBeenCalled();
    });

    it('should not update the editor value if project name is null', () => {
      spyOn(editor.projectNameHook_, 'get').and.returnValue(null);
      spyOn(editor.editorValueHook_, 'get').and.returnValue('oldProjectName');
      spyOn(editor.editorValueHook_, 'set');
      editor.onProjectNameChanged_();
      assert(editor.editorValueHook_.set).toNot.haveBeenCalled();
    });
  });
});
