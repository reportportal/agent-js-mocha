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

const EventEmitter = require('events');
const { getDefaultConfig, RPClient } = require('./mocks');
const ReportportalAgent = require('./../lib/mochaReporter');

describe('attributes reporting', function () {
  let reporter;
  beforeAll(function () {
    const options = getDefaultConfig();
    const runner = new EventEmitter();
    reporter = new ReportportalAgent(runner, options);
    reporter.rpClient = new RPClient(options.reporterOptions);
    reporter.suitesStackTempId = ['tempRootSuiteId', 'tempSuiteId'];
  });

  afterEach(function () {
    reporter.currentTest = null;
    reporter.attributes.clear();
    jest.clearAllMocks();
  });

  it('onAddAttributes: should add attributes for current test in attributes map', function () {
    const currentTest = {
      title: 'test',
      tempId: 'testItemId',
    };
    reporter.currentTest = currentTest;
    const attributes = [
      {
        key: 'key1',
        value: 'value1',
      },
    ];
    const expectedAttributes = new Map([['testItemId', attributes]]);

    reporter.onAddAttributes({ attributes });

    expect(reporter.attributes).toEqual(expectedAttributes);
  });

  it('onAddAttributes: should append attributes for current test in attributes map', function () {
    const currentTest = {
      title: 'test',
      tempId: 'testItemId',
    };
    reporter.currentTest = currentTest;
    reporter.attributes.set('testItemId', [
      {
        key: 'key1',
        value: 'value1',
      },
    ]);
    const attributes = [
      {
        key: 'key2',
        value: 'value2',
      },
      {
        key: 'key3',
        value: 'value3',
      },
    ];

    const expectedAttributesMap = new Map([
      [
        'testItemId',
        [
          {
            key: 'key1',
            value: 'value1',
          },
          {
            key: 'key2',
            value: 'value2',
          },
          {
            key: 'key3',
            value: 'value3',
          },
        ],
      ],
    ]);

    reporter.onAddAttributes({ attributes });

    expect(reporter.attributes).toEqual(expectedAttributesMap);
  });

  it('onAddAttributes: should add attributes for current suite in attributes map', function () {
    const attributes = [
      {
        key: 'key1',
        value: 'value1',
      },
      {
        key: 'key2',
        value: 'value2',
      },
    ];

    const expectedAttributesMap = new Map([
      [
        'tempSuiteId',
        [
          {
            key: 'key1',
            value: 'value1',
          },
          {
            key: 'key2',
            value: 'value2',
          },
        ],
      ],
    ]);

    reporter.onAddAttributes({ attributes });

    expect(reporter.attributes).toEqual(expectedAttributesMap);
  });

  it('onAddAttributes without attributes: should not add attributes for current suite in attributes map', function () {
    const expectedAttributesMap = new Map();

    reporter.onAddAttributes({});

    expect(reporter.attributes).toEqual(expectedAttributesMap);
  });
});
