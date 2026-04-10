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
const {
  getCodeRef,
  getAgentInfo,
  parseAttributes,
  convertIsoStringToMicroseconds,
  getBeforeHookStartTime,
} = require('./../lib/utils');

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

    it('should contain framework_version property', function () {
      const agentInfo = getAgentInfo();

      expect(Object.keys(agentInfo)).toContain('framework_version');
      expect(typeof agentInfo.framework_version).toBe('string');
    });

    it('should fall back to declared version when mocha package is not found', function () {
      jest.resetModules();
      jest.doMock('mocha/package.json', () => {
        // eslint-disable-next-line no-throw-literal
        throw { code: 'MODULE_NOT_FOUND' };
      });
      // eslint-disable-next-line global-require
      const { getAgentInfo: getAgentInfoFresh } = require('./../lib/utils');
      const agentInfo = getAgentInfoFresh();

      expect(Object.keys(agentInfo)).toContain('framework_version');
      expect(typeof agentInfo.framework_version).toBe('string');
    });

    it('should use declared version when mocha package.json has no version', function () {
      jest.resetModules();
      jest.doMock('mocha/package.json', () => ({ version: '' }), { virtual: true });
      // eslint-disable-next-line global-require
      const { getAgentInfo: getAgentInfoFresh } = require('./../lib/utils');
      const agentInfo = getAgentInfoFresh();

      expect(Object.keys(agentInfo)).toContain('framework_version');
      expect(typeof agentInfo.framework_version).toBe('string');
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
    expect(actualArray).toEqual(array);
  });

  describe('convertIsoStringToMicroseconds', () => {
    it('converts ISO string with microseconds correctly', () => {
      const isoString = '2024-09-20T14:32:35.304456Z';
      const expectedMicroseconds = 1726842755304456;
      expect(convertIsoStringToMicroseconds(isoString)).toBe(expectedMicroseconds);
    });

    it('handles microseconds accurately', () => {
      const isoString = '2021-03-15T12:00:00.000001Z';
      const expectedMicroseconds = 1615809600000001;
      expect(convertIsoStringToMicroseconds(isoString)).toBe(expectedMicroseconds);
    });

    it('returns correct microseconds at epoch start', () => {
      const isoString = '1970-01-01T00:00:00.000001Z';
      const expectedMicroseconds = 1;
      expect(convertIsoStringToMicroseconds(isoString)).toBe(expectedMicroseconds);
    });
  });

  describe('getBeforeHookStartTime', () => {
    it('should return ISO string with 1 millisecond subtracted', () => {
      const isoString = '2024-09-20T14:32:35.304456Z';
      const expected = '2024-09-20T14:32:35.303456Z';
      expect(getBeforeHookStartTime(isoString)).toBe(expected);
    });

    it('should handle microsecond underflow within the same second', () => {
      const isoString = '2024-09-20T14:32:35.000500Z';
      const expected = '2024-09-20T14:32:34.999500Z';
      expect(getBeforeHookStartTime(isoString)).toBe(expected);
    });
  });
});
