import { assert, TestBase } from '../test-base';
TestBase.setup();

import { Mocks } from 'external/gs_tools/src/mock';

import { ProjectSettingsRouteFactory } from '../routing/project-settings-route-factory';


describe('routing.ProjectSettingsRouteFactory', () => {
  let mockProjectCollection;
  let factory: ProjectSettingsRouteFactory;

  beforeEach(() => {
    mockProjectCollection = jasmine.createSpyObj('ProjectCollection', ['get']);
    factory = new ProjectSettingsRouteFactory(
        mockProjectCollection,
        Mocks.object('Parent'));
  });

  describe('getName', () => {
    it('should resolve with the correct name', async () => {
      const projectId = 'projectId';
      const projectName = 'projectName';
      const mockProject = jasmine.createSpyObj('Project', ['getName']);
      mockProject.getName.and.returnValue(projectName);
      mockProjectCollection.get.and.returnValue(mockProject);
      assert(await factory.getName({projectId})).to.equal(`Settings for ${projectName}`);
      assert(mockProjectCollection.get).to.haveBeenCalledWith(projectId);
    });

    it('should resolve with the correct name if project cannot be found', async () => {
      mockProjectCollection.get.and.returnValue(null);
      assert(await factory.getName({projectId: 'projectId'})).to.equal(`Settings`);
    });
  });
});
