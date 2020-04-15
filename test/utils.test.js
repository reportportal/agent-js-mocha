const { getCodeRef, getAgentInfo } = require('./../lib/utils');

describe('utils', function() {
  describe('getCodeRef', function() {
    it('should return correct code ref', function() {
      jest.mock('path', () => ({
        sep: '\\',
      }));
      jest.spyOn(process, 'cwd').mockImplementation(() => 'C:\\testProject');
      const mockedTest = {
        title: 'testTitle',
        file: `C:\\testProject\\test\\example.js`,
        titlePath: () => ['rootDescribe', 'parentDescribe', 'testTitle'],
      };
      const expectedCodeRef = `test/example.js/rootDescribe/parentDescribe/testTitle`;

      const codeRef = getCodeRef(mockedTest);

      expect(codeRef).toEqual(expectedCodeRef);

      jest.clearAllMocks();
    });
  });
  describe('getAgentInfo', function() {
    it('should contain version and name properties', function() {
      const agentInfo = getAgentInfo();

      expect(Object.keys(agentInfo)).toContain('version');
      expect(Object.keys(agentInfo)).toContain('name');
    });
  });
});
