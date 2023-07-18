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
const testStatuses = require('./../lib/constants/testStatuses');

jest.mock('./../lib/utils');

describe('test items reporting', function () {
  let reporter;
  let suite;

  const createAndPrepareReporter = (customReporterOptions = {}) => {
    const options = getDefaultConfig();
    Object.assign(options.reporterOptions, customReporterOptions);
    const runner = new EventEmitter();
    reporter = new ReportportalAgent(runner, options);
    reporter.rpClient = new RPClient(options);
    reporter.launchId = 'tempLaunchId';
    suite = {
      title: 'Suite',
      parent: {},
    };
    reporter.suitesInfo.set(suite, { tempId: 'tempSuiteId', startTime: mockedDate });
    return reporter;
  };

  describe('finishTest', function () {
    afterEach(function () {
      reporter.currentTest = null;
      reporter.hookIds.clear();
      reporter.attributes.clear();
      reporter.descriptions.clear();
      jest.clearAllMocks();
    });
    it('should finish test with specified status', function () {
      reporter = createAndPrepareReporter();
      const spyFinishTestItem = jest.spyOn(reporter.rpClient, 'finishTestItem');
      const currentTest = {
        title: 'test',
        parent: suite,
        state: 'passed',
        tempId: 'testItemId',
      };
      const expectedTestFinishObj = {
        endTime: mockedDate,
        status: 'failed',
        retry: false,
      };
      reporter.currentTest = currentTest;

      reporter.finishTest(currentTest, testStatuses.FAILED);

      expect(spyFinishTestItem).toHaveBeenCalledWith('testItemId', expectedTestFinishObj);
    });

    it('skippedIssue is not defined: should finish skipped test with issue', function () {
      reporter = createAndPrepareReporter();
      const spyFinishTestItem = jest.spyOn(reporter.rpClient, 'finishTestItem');
      const currentTest = {
        title: 'test',
        parent: suite,
        state: 'pending',
        tempId: 'testItemId',
      };
      const expectedTestFinishObj = {
        endTime: mockedDate,
        status: 'skipped',
        retry: false,
      };
      reporter.currentTest = currentTest;

      reporter.finishTest(currentTest, testStatuses.SKIPPED);

      expect(spyFinishTestItem).toHaveBeenCalledWith('testItemId', expectedTestFinishObj);
    });

    it('skippedIssue=false: should finish skipped test with issue NOT_ISSUE', function () {
      reporter = createAndPrepareReporter({
        skippedIssue: false,
      });
      const spyFinishTestItem = jest.spyOn(reporter.rpClient, 'finishTestItem');
      const currentTest = {
        title: 'test',
        parent: suite,
        state: 'pending',
        tempId: 'testItemId',
      };
      const expectedTestFinishObj = {
        endTime: mockedDate,
        status: 'skipped',
        retry: false,
        issue: {
          issueType: 'NOT_ISSUE',
        },
      };
      reporter.currentTest = currentTest;

      reporter.finishTest(currentTest, testStatuses.SKIPPED);

      expect(spyFinishTestItem).toHaveBeenCalledWith('testItemId', expectedTestFinishObj);
    });

    it('attributes exists for test: should finish test with corresponded attributes', function () {
      reporter = createAndPrepareReporter();
      const spyFinishTestItem = jest.spyOn(reporter.rpClient, 'finishTestItem');
      const currentTest = {
        tempId: 'testItemId',
      };
      reporter.attributes.set('testItemId', [{ key: 'key1', value: 'value1' }]);

      const expectedTestFinishObj = {
        endTime: mockedDate,
        retry: false,
        status: 'passed',
        attributes: [{ key: 'key1', value: 'value1' }],
      };
      reporter.currentTest = currentTest;

      reporter.finishTest(currentTest, testStatuses.PASSED);

      expect(spyFinishTestItem).toHaveBeenCalledWith('testItemId', expectedTestFinishObj);
    });
    it('description exists for the test: should finish test with description', function () {
      reporter = createAndPrepareReporter();
      const spyFinishTestItem = jest.spyOn(reporter.rpClient, 'finishTestItem');
      const currentTest = {
        tempId: 'testItemId',
      };
      reporter.descriptions.set('testItemId', 'test description');

      const expectedTestFinishObj = {
        endTime: mockedDate,
        retry: false,
        status: 'passed',
        description: 'test description',
      };
      reporter.currentTest = currentTest;

      reporter.finishTest(currentTest, testStatuses.PASSED);

      expect(spyFinishTestItem).toHaveBeenCalledWith('testItemId', expectedTestFinishObj);
    });
    it('description should contain last error log', function () {
      reporter = createAndPrepareReporter();
      const spyFinishTestItem = jest.spyOn(reporter.rpClient, 'finishTestItem');
      const currentTest = {
        tempId: 'testItemId',
        err: {
          stack: 'some error',
        },
      };
      const description = 'test description';
      reporter.descriptions.set('testItemId', description);

      const descriptionWithError = description.concat(
        `\n\`\`\`error\n${currentTest.err.stack}\n\`\`\``,
      );
      const expectedTestFinishObj = {
        endTime: mockedDate,
        retry: false,
        status: 'failed',
        description: descriptionWithError,
      };
      reporter.currentTest = currentTest;

      reporter.finishTest(currentTest, testStatuses.FAILED);

      expect(spyFinishTestItem).toHaveBeenCalledWith('testItemId', expectedTestFinishObj);
    });
    it('testCaseId exists for the test: should finish test with testCaseId', function () {
      reporter = createAndPrepareReporter();
      const spyFinishTestItem = jest.spyOn(reporter.rpClient, 'finishTestItem');
      const currentTest = {
        tempId: 'testItemId',
      };
      reporter.testCaseIds.set('testItemId', 'test_case_Id');

      const expectedTestFinishObj = {
        endTime: mockedDate,
        retry: false,
        status: 'passed',
        testCaseId: 'test_case_Id',
      };
      reporter.currentTest = currentTest;

      reporter.finishTest(currentTest, testStatuses.PASSED);

      expect(spyFinishTestItem).toHaveBeenCalledWith('testItemId', expectedTestFinishObj);
    });

    it('custom status assigned for the test: should finish test with custom status', function () {
      reporter = createAndPrepareReporter();
      const spyFinishTestItem = jest.spyOn(reporter.rpClient, 'finishTestItem');
      const currentTest = {
        tempId: 'testItemId',
      };

      const expectedTestFinishObj = {
        endTime: mockedDate,
        retry: false,
        status: 'info',
      };
      reporter.currentTest = currentTest;
      reporter.setStatus({ status: 'info' });

      reporter.finishTest(currentTest, testStatuses.PASSED);

      expect(spyFinishTestItem).toHaveBeenCalledWith('testItemId', expectedTestFinishObj);
    });
  });

  describe('test event listeners', function () {
    beforeAll(function () {
      reporter = createAndPrepareReporter();
    });

    afterEach(function () {
      reporter.currentTest = null;
      reporter.hookIds.clear();
      jest.clearAllMocks();
    });

    describe('onTestStart', function () {
      it('should start test', function () {
        const spyStartTestItem = jest.spyOn(reporter.rpClient, 'startTestItem');
        const testItem = {
          title: 'test',
          parent: suite,
        };
        const expectedTestStartObj = {
          name: 'test',
          startTime: mockedDate,
          attributes: [],
          type: 'step',
          retry: false,
        };

        reporter.onTestStart(testItem);

        expect(spyStartTestItem).toHaveBeenCalledWith(
          expectedTestStartObj,
          'tempLaunchId',
          'tempSuiteId',
        );
      });

      it('should start first retry', function () {
        const spyStartTestItem = jest.spyOn(reporter.rpClient, 'startTestItem');
        const testItem = {
          title: 'test',
          parent: suite,
          _retries: 2,
        };
        const expectedTestStartObj = {
          name: 'test',
          startTime: mockedDate,
          attributes: [],
          type: 'step',
          retry: true,
        };

        reporter.onTestStart(testItem);

        expect(spyStartTestItem).toHaveBeenCalledWith(
          expectedTestStartObj,
          'tempLaunchId',
          'tempSuiteId',
        );
      });

      it('should finish first and start second retry', function () {
        const spyStartTestItem = jest.spyOn(reporter.rpClient, 'startTestItem');
        const spyFinishTestItem = jest.spyOn(reporter.rpClient, 'finishTestItem');
        const testItem = {
          title: 'test',
          parent: suite,
          _retries: 2,
        };
        const expectedTestStartObj = {
          name: 'test',
          startTime: mockedDate,
          attributes: [],
          type: 'step',
          retry: true,
        };
        const expectedTestFinishObj = {
          status: 'failed',
          endTime: mockedDate,
          retry: true,
        };

        reporter.onTestStart(testItem);
        reporter.onTestStart(testItem);

        expect(spyStartTestItem).toHaveBeenCalledTimes(2);
        expect(spyStartTestItem).toHaveBeenCalledWith(
          expectedTestStartObj,
          'tempLaunchId',
          'tempSuiteId',
        );
        expect(spyFinishTestItem).toHaveBeenCalledWith('testItemId', expectedTestFinishObj);
      });
    });

    describe('onTestPending', function () {
      it('should start and finish pending test', function () {
        const spyStartTestItem = jest.spyOn(reporter.rpClient, 'startTestItem');
        const spyFinishTestItem = jest.spyOn(reporter.rpClient, 'finishTestItem');
        const testItem = {
          title: 'test',
          parent: suite,
          state: 'pending',
        };
        const expectedTestStartObj = {
          name: 'test',
          startTime: mockedDate,
          attributes: [],
          type: 'step',
          retry: false,
        };
        const expectedTestFinishObj = {
          endTime: mockedDate,
          status: 'skipped',
          retry: false,
        };

        reporter.onTestPending(testItem);

        expect(spyStartTestItem).toHaveBeenCalledWith(
          expectedTestStartObj,
          'tempLaunchId',
          'tempSuiteId',
        );
        expect(spyFinishTestItem).toHaveBeenCalledWith('testItemId', expectedTestFinishObj);
      });
    });

    describe('onTestFinish', function () {
      it('should finish passed test', function () {
        const spyFinishTestItem = jest.spyOn(reporter.rpClient, 'finishTestItem');
        const currentTest = {
          title: 'test',
          parent: suite,
          state: 'passed',
          tempId: 'testItemId',
        };
        const expectedTestFinishObj = {
          endTime: mockedDate,
          status: 'passed',
          retry: false,
        };
        reporter.currentTest = currentTest;

        reporter.onTestFinish(currentTest);

        expect(spyFinishTestItem).toHaveBeenCalledWith('testItemId', expectedTestFinishObj);
      });

      it('should finish failed test', function () {
        const spyFinishTestItem = jest.spyOn(reporter.rpClient, 'finishTestItem');
        const currentTest = {
          title: 'test',
          parent: suite,
          state: 'failed',
          tempId: 'testItemId',
        };
        const expectedTestFinishObj = {
          endTime: mockedDate,
          status: 'failed',
          retry: false,
        };
        reporter.currentTest = currentTest;

        reporter.onTestFinish(currentTest);

        expect(spyFinishTestItem).toHaveBeenCalledWith('testItemId', expectedTestFinishObj);
      });

      it('should finish failed retry', function () {
        const spyFinishTestItem = jest.spyOn(reporter.rpClient, 'finishTestItem');
        const currentTest = {
          title: 'test',
          parent: suite,
          state: 'failed',
          _retries: 2,
          tempId: 'testItemId',
        };
        const expectedTestFinishObj = {
          endTime: mockedDate,
          status: 'failed',
          retry: true,
        };
        reporter.currentTest = currentTest;

        reporter.onTestFinish(currentTest);

        expect(spyFinishTestItem).toHaveBeenCalledWith('testItemId', expectedTestFinishObj);
      });
    });

    describe('onTestFail', function () {
      it('should send log on test fail', function () {
        const spySendLog = jest.spyOn(reporter.rpClient, 'sendLog');
        const currentTest = {
          title: 'test',
          parent: suite,
          state: 'failed',
          tempId: 'testItemId',
        };
        const expectedLogObj = {
          level: 'ERROR',
          message: 'error message',
        };
        reporter.currentTest = currentTest;

        reporter.onTestFail(currentTest, 'error message');

        expect(spySendLog).toHaveBeenCalledWith('testItemId', expectedLogObj);
      });

      it('should finish current test as skipped on hook fail', function () {
        const spyFinishTestItem = jest.spyOn(reporter.rpClient, 'finishTestItem');
        const currentTest = {
          title: 'test #1',
          parent: suite,
          state: 'pending',
          tempId: 'testItemId',
        };
        reporter.currentTest = currentTest;
        const hook = {
          title: '"before each" hook: named hook',
          parent: suite,
          state: 'failed',
          type: 'hook',
          ctx: {
            currentTest,
          },
        };
        const expectedTestFinishObj = {
          endTime: mockedDate,
          status: 'skipped',
          retry: false,
        };
        reporter.hookIds.set(hook, 'hookId');
        hook.state = 'failed';

        reporter.onTestFail(hook, 'error message');

        expect(spyFinishTestItem).toHaveBeenCalledTimes(1);
        expect(spyFinishTestItem).toHaveBeenCalledWith('testItemId', expectedTestFinishObj);
      });
    });
  });
});
