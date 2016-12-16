import {assert, TestBase} from '../test-base';
TestBase.setup();

import {Project} from './project';


describe('data.Project', () => {
  let project: Project;

  beforeEach(() => {
    project = new Project('projectId');
  });

  describe('getSearchIndex', () => {
    it('should return the correct index', () => {
      let name = 'name';
      project.setName(name);
      assert(project.getSearchIndex()).to.equal({
        name: name,
        this: project,
      });
    });
  });
});
