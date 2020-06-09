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
const { getDefaultConfig, RPClient, mockedDate } = require('./mocks');
const ReportportalAgent = require('./../lib/mochaReporter');

jest.mock('./../lib/utils');

describe('suites reporting', function() {
  let reporter;
  let suiteFirstLevel;
  let suiteSecondLevel;
  let rootSuite;

  beforeAll(function() {
    const options = getDefaultConfig();
    const runner = new EventEmitter();
    reporter = new ReportportalAgent(runner, options);
    reporter.rpClient = new RPClient(options);
    reporter.launchId = 'tempLaunchId';
    rootSuite = {
      title: '',
      root: true,
    };
    suiteFirstLevel = {
      title: 'First level suite',
      parent: rootSuite,
    };
    suiteSecondLevel = {
      title: 'Second level suite',
      parent: suiteFirstLevel,
    };
  });

  afterEach(function() {
    reporter.suitesInfo.clear();
    jest.clearAllMocks();
  });

  describe('onSuiteStart', function() {
    it("shouldn't start root suite", function() {
      const spyStartTestItem = jest.spyOn(reporter.rpClient, 'startTestItem');

      reporter.onSuiteStart(rootSuite);

      expect(spyStartTestItem).not.toHaveBeenCalled();
    });

    it('should start first-level suite', function() {
      const spyStartTestItem = jest.spyOn(reporter.rpClient, 'startTestItem');
      reporter.suitesInfo.set(rootSuite, undefined);
      const expectedSuiteStartObj = {
        name: 'First level suite',
        startTime: mockedDate,
        attributes: [],
        type: 'suite',
      };

      reporter.onSuiteStart(suiteFirstLevel);

      expect(spyStartTestItem).toHaveBeenCalledWith(
        expectedSuiteStartObj,
        'tempLaunchId',
        undefined,
      );
    });

    it('should start nested suite', function() {
      const spyStartTestItem = jest.spyOn(reporter.rpClient, 'startTestItem');
      reporter.suitesInfo.set(rootSuite, undefined);
      reporter.suitesInfo.set(suiteFirstLevel, {
        tempId: 'firstLevelSuiteId',
        startTime: mockedDate,
      });
      const expectedSuiteStartObj = {
        name: 'Second level suite',
        startTime: mockedDate,
        attributes: [],
        type: 'suite',
      };

      reporter.onSuiteStart(suiteSecondLevel);

      expect(spyStartTestItem).toHaveBeenCalledWith(
        expectedSuiteStartObj,
        'tempLaunchId',
        'firstLevelSuiteId',
      );
    });
  });

  describe('finishTestItem', function() {
    it('should finish started suite', function() {
      const spyFinishTestItem = jest.spyOn(reporter.rpClient, 'finishTestItem');
      reporter.suitesInfo.set(rootSuite, undefined);
      reporter.suitesInfo.set(suiteFirstLevel, {
        tempId: 'firstLevelSuiteId',
        startTime: mockedDate,
      });

      reporter.onSuiteFinish(suiteFirstLevel);

      expect(spyFinishTestItem).toHaveBeenCalledWith('firstLevelSuiteId', { endTime: mockedDate });
    });
  });
});
