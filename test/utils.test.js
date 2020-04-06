const path = require('path');
const { getCodeRef } = require('./../lib/utils');

describe('utils', function() {
  it('should return correct code ref', function() {
    const mockedTest = {
      title: 'testTitle',
      file: `${process.cwd()}${path.sep}test${path.sep}example.js`,
      titlePath: () => ['rootDescribe', 'parentDescribe', 'testTitle'],
    };
    const expectedCodeRef = `test/example.js/rootDescribe/parentDescribe/testTitle`;

    const codeRef = getCodeRef(mockedTest);

    expect(codeRef).toEqual(expectedCodeRef);
  });
});
