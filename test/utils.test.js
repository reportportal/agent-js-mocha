/*
 *  Copyright 2020 EPAM Systems
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

const path = require('path');
const { getCodeRef, getAgentInfo, parseAttributes } = require('./../lib/utils');

describe('utils', function () {
  describe('getCodeRef', function () {
    it('should return correct code ref', function () {
      jest.spyOn(process, 'cwd').mockImplementation(() => `C:${path.sep}testProject`);
      const mockedTest = {
        title: 'testTitle',
        file: `C:${path.sep}testProject${path.sep}test${path.sep}example.js`,
        titlePath: () => ['rootDescribe', 'parentDescribe', 'testTitle'],
      };
      const expectedCodeRef = `test/example.js/rootDescribe/parentDescribe/testTitle`;

      const codeRef = getCodeRef(mockedTest);

      expect(codeRef).toEqual(expectedCodeRef);

      jest.clearAllMocks();
    });
  });
  describe('getAgentInfo', function () {
    it('should contain version and name properties', function () {
      const agentInfo = getAgentInfo();

      expect(Object.keys(agentInfo)).toContain('version');
      expect(Object.keys(agentInfo)).toContain('name');
    });
  });
  describe('parseAttributes', function () {
    it('should parse string to array', function () {
      const actualArray = parseAttributes('attributeKey1:attributeValue1;attributeValue2');
      const expectedArray = [
        { key: 'attributeKey1', value: 'attributeValue1' },
        { value: 'attributeValue2' },
      ];
      expect(actualArray).toEqual(expectedArray);
    });
  });
  it('should return passed array', function () {
    const array = [
      { key: 'attributeKey1', value: 'attributeValue1' },
      { value: 'attributeValue2' },
    ];
    const actualArray = parseAttributes(array);
    const expectedArray = array;
    expect(actualArray).toEqual(expectedArray);
  });
});
