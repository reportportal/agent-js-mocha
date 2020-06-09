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

const createReporter = (customReporterOptions = {}) => {
  const options = getDefaultConfig();
  options.reporterOptions = Object.assign(options.reporterOptions, customReporterOptions);
  const runner = new EventEmitter();
  const reporter = new ReportportalAgent(runner, options);
  reporter.rpClient = new RPClient(options);
  return reporter;
};

describe('reporting hooks', function() {
  let reporter;
  const rootSuite = {
    title: '',
    root: true,
  };
  const suiteFirstLevel = {
    title: 'Suite',
    parent: rootSuite,
  };
  describe('reportHooks = true', function() {
    beforeAll(function() {
      reporter = createReporter({ reportHooks: true });
      reporter.launchId = 'tempLaunchId';
      reporter.suitesInfo.set(rootSuite, undefined);
      reporter.suitesInfo.set(suiteFirstLevel, {
        tempId: 'tempSuiteId',
        startTime: mockedDate,
      });
    });

    afterEach(function() {
      reporter.hookIds.clear();
      reporter.currentTest = null;
      jest.clearAllMocks();
    });
    describe('onHookStart', function() {
      beforeEach(function() {
        reporter.currentTest = {
          startTime: mockedDate + 1,
        };
      });
      it('should start before each hook', function() {
        const spyStartTestItem = jest.spyOn(reporter.rpClient, 'startTestItem');
        const hook = {
          title: '"before each" hook: before each hook with title',
          parent: suiteFirstLevel,
        };
        const expectedHookStartObj = {
          name: 'before each hook with title',
          startTime: mockedDate,
          type: 'BEFORE_METHOD',
        };

        reporter.onHookStart(hook);

        expect(spyStartTestItem).toHaveBeenCalledWith(
          expectedHookStartObj,
          'tempLaunchId',
          'tempSuiteId',
        );
      });

      it('should start before all hook', function() {
        const spyStartTestItem = jest.spyOn(reporter.rpClient, 'startTestItem');
        const hook = {
          title: '"before all" hook: before all hook with title',
          parent: suiteFirstLevel,
        };
        const expectedHookStartObj = {
          name: 'before all hook with title',
          startTime: mockedDate - 1,
          type: 'BEFORE_SUITE',
        };

        reporter.onHookStart(hook);

        expect(spyStartTestItem).toHaveBeenCalledWith(
          expectedHookStartObj,
          'tempLaunchId',
          undefined,
        );
      });

      it('should start after each hook', function() {
        const spyStartTestItem = jest.spyOn(reporter.rpClient, 'startTestItem');
        const hook = {
          title: '"after each" hook: after each hook with title',
          parent: suiteFirstLevel,
        };
        const expectedHookStartObj = {
          name: 'after each hook with title',
          startTime: mockedDate,
          type: 'AFTER_METHOD',
        };

        reporter.onHookStart(hook);

        expect(spyStartTestItem).toHaveBeenCalledWith(
          expectedHookStartObj,
          'tempLaunchId',
          'tempSuiteId',
        );
      });

      it('should start after all hook', function() {
        const spyStartTestItem = jest.spyOn(reporter.rpClient, 'startTestItem');
        const hook = {
          title: '"after all" hook: after all hook with title',
          parent: suiteFirstLevel,
        };
        const expectedHookStartObj = {
          name: 'after all hook with title',
          startTime: mockedDate,
          type: 'AFTER_SUITE',
        };

        reporter.onHookStart(hook);

        expect(spyStartTestItem).toHaveBeenCalledWith(
          expectedHookStartObj,
          'tempLaunchId',
          undefined,
        );
      });
    });

    describe('onHookFinish', function() {
      it('should finish passed hook', function() {
        const hook = {
          title: '"before each" hook: before each hook with title',
          parent: suiteFirstLevel,
        };
        reporter.hookIds.set(hook, 'hookTempId');
        hook.state = 'passed';
        const expectedHookFinishObj = {
          status: 'passed',
          endTime: mockedDate,
        };

        reporter.onHookFinish(hook);

        expect(reporter.rpClient.finishTestItem).toHaveBeenCalledWith(
          'hookTempId',
          expectedHookFinishObj,
        );
      });

      it('should finish failed hook', function() {
        const spyFinishTestItem = jest.spyOn(reporter.rpClient, 'finishTestItem');
        const spySendLog = jest.spyOn(reporter.rpClient, 'sendLog');
        const currentTest = {
          title: 'test #1',
          parent: suiteFirstLevel,
          state: 'pending',
          tempId: 'tempTestId',
        };
        reporter.currentTest = currentTest;
        const hook = {
          title: '"before each" hook: named hook',
          parent: suiteFirstLevel,
          state: 'failed',
          type: 'hook',
          ctx: {
            currentTest,
          },
        };
        reporter.hookIds.set(hook, 'tempHookId');
        hook.state = 'failed';
        const expectedHookFinishObj = {
          status: 'failed',
          endTime: mockedDate,
        };
        const expectedLogObj = {
          level: 'ERROR',
          message: 'error message',
        };

        reporter.onTestFail(hook, 'error message');

        expect(spySendLog).toHaveBeenCalledWith('tempTestId', expectedLogObj);
        expect(spyFinishTestItem).toHaveBeenCalledWith('tempHookId', expectedHookFinishObj);
      });
    });
  });

  describe('reportHooks is not defined', function() {
    beforeAll(function() {
      reporter = createReporter();
      reporter.launchId = 'tempLaunchId';
      reporter.suitesInfo.set(rootSuite, undefined);
      reporter.suitesInfo.set(suiteFirstLevel, { tempId: 'tempSuiteId', startTime: mockedDate });
    });

    afterEach(function() {
      reporter.hookIds.clear();
      reporter.currentTest = null;
      jest.clearAllMocks();
    });

    it('onHookStart: should not start hook', function() {
      const spyStartTestItem = jest.spyOn(reporter.rpClient, 'startTestItem');
      const hook = {
        title: '"before each" hook: before each hook with title',
        parent: suiteFirstLevel,
      };

      reporter.onHookStart(hook);

      expect(spyStartTestItem).not.toHaveBeenCalled();
    });

    it('onHookFinish: should not finish hook', function() {
      const spyFinishTestItem = jest.spyOn(reporter.rpClient, 'finishTestItem');
      const hook = {
        title: '"before each" hook: before each hook with title',
        parent: suiteFirstLevel,
      };

      reporter.onHookFinish(hook);

      expect(spyFinishTestItem).not.toHaveBeenCalled();
    });
  });
});
