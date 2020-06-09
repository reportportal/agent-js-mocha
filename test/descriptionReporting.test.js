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

describe('description reporting', function() {
  let reporter;
  beforeAll(function() {
    const options = getDefaultConfig();
    const runner = new EventEmitter();
    reporter = new ReportportalAgent(runner, options);
    reporter.rpClient = new RPClient(options);
    reporter.suitesStackTempId = ['tempRootSuiteId', 'tempSuiteId'];
  });

  afterEach(function() {
    reporter.currentTest = null;
    reporter.descriptions.clear();
    jest.clearAllMocks();
  });

  it('onSetDescription: should set description for current test in the descriptions map', function() {
    const currentTest = {
      title: 'test',
      tempId: 'testItemId',
    };
    reporter.currentTest = currentTest;
    const description = 'test description';
    const expectedDescriptionsMap = new Map([['testItemId', description]]);

    reporter.onSetDescription({ text: description });

    expect(reporter.descriptions).toEqual(expectedDescriptionsMap);
  });

  it('onSetDescription: should overwrite description for current test in the descriptions map', function() {
    const currentTest = {
      title: 'test',
      tempId: 'testItemId',
    };
    reporter.currentTest = currentTest;
    reporter.descriptions.set('testItemId', 'old description');
    const newDescription = 'new description';

    const expectedDescriptionsMap = new Map([['testItemId', newDescription]]);

    reporter.onSetDescription({ text: newDescription });

    expect(reporter.descriptions).toEqual(expectedDescriptionsMap);
  });

  it('onSetDescription: should set description for current suite in descriptions map', function() {
    const description = 'test description';
    const expectedDescriptionsMap = new Map([['tempSuiteId', description]]);

    reporter.onSetDescription({ text: description });

    expect(reporter.descriptions).toEqual(expectedDescriptionsMap);
  });
});
