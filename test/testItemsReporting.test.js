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
const helpers = require('@reportportal/client-javascript/lib/helpers');
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

  beforeEach(() => {
    jest.spyOn(helpers, 'now').mockReturnValue(mockedDate);
  });

  describe('finishTest', function () {
    afterEach(function () {
      reporter.activeTests.clear();
      reporter.hookIds.clear();
      reporter.testsInfo.clear();
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
      reporter.activeTests.set(currentTest, currentTest);

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
      reporter.activeTests.set(currentTest, currentTest);

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
      reporter.activeTests.set(currentTest, currentTest);

      reporter.finishTest(currentTest, testStatuses.SKIPPED);

      expect(spyFinishTestItem).toHaveBeenCalledWith('testItemId', expectedTestFinishObj);
    });

    it('attributes exists for test: should finish test with corresponded attributes', function () {
      reporter = createAndPrepareReporter();
      const spyFinishTestItem = jest.spyOn(reporter.rpClient, 'finishTestItem');
      const currentTest = {
        tempId: 'testItemId',
      };
      reporter.testsInfo.set('testItemId', {
        attributes: [{ key: 'key1', value: 'value1' }],
      });

      const expectedTestFinishObj = {
        endTime: mockedDate,
        retry: false,
        status: 'passed',
        attributes: [{ key: 'key1', value: 'value1' }],
      };
      reporter.activeTests.set(currentTest, currentTest);

      reporter.finishTest(currentTest, testStatuses.PASSED);

      expect(spyFinishTestItem).toHaveBeenCalledWith('testItemId', expectedTestFinishObj);
    });
    it('description exists for the test: should finish test with description', function () {
      reporter = createAndPrepareReporter();
      const spyFinishTestItem = jest.spyOn(reporter.rpClient, 'finishTestItem');
      const currentTest = {
        tempId: 'testItemId',
      };
      reporter.testsInfo.set('testItemId', {
        description: 'test description',
      });

      const expectedTestFinishObj = {
        endTime: mockedDate,
        retry: false,
        status: 'passed',
        description: 'test description',
      };
      reporter.activeTests.set(currentTest, currentTest);

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
      reporter.testsInfo.set('testItemId', {
        description,
      });

      const descriptionWithError = description.concat(
        `\n\`\`\`error\n${currentTest.err.stack}\n\`\`\``,
      );
      const expectedTestFinishObj = {
        endTime: mockedDate,
        retry: false,
        status: 'failed',
        description: descriptionWithError,
      };
      reporter.activeTests.set(currentTest, currentTest);

      reporter.finishTest(currentTest, testStatuses.FAILED);

      expect(spyFinishTestItem).toHaveBeenCalledWith('testItemId', expectedTestFinishObj);
    });
    it('extendTestDescriptionWithLastError=false: should not append last error', function () {
      reporter = createAndPrepareReporter({
        extendTestDescriptionWithLastError: false,
      });
      const spyFinishTestItem = jest.spyOn(reporter.rpClient, 'finishTestItem');
      const currentTest = {
        tempId: 'testItemId',
        err: {
          stack: 'some error',
        },
      };
      const description = 'test description';
      reporter.testsInfo.set('testItemId', {
        description,
      });

      const expectedTestFinishObj = {
        endTime: mockedDate,
        retry: false,
        status: 'failed',
        description,
      };
      reporter.activeTests.set(currentTest, currentTest);

      reporter.finishTest(currentTest, testStatuses.FAILED);

      expect(spyFinishTestItem).toHaveBeenCalledWith('testItemId', expectedTestFinishObj);
    });
    it('testCaseId exists for the test: should finish test with testCaseId', function () {
      reporter = createAndPrepareReporter();
      const spyFinishTestItem = jest.spyOn(reporter.rpClient, 'finishTestItem');
      const currentTest = {
        tempId: 'testItemId',
      };
      reporter.testsInfo.set('testItemId', {
        testCaseId: 'test_case_Id',
      });

      const expectedTestFinishObj = {
        endTime: mockedDate,
        retry: false,
        status: 'passed',
        testCaseId: 'test_case_Id',
      };
      reporter.activeTests.set(currentTest, currentTest);

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
      reporter.activeTests.set(currentTest, currentTest);
      reporter.setStatus({ status: 'info' });

      reporter.finishTest(currentTest, testStatuses.PASSED);

      expect(spyFinishTestItem).toHaveBeenCalledWith('testItemId', expectedTestFinishObj);
    });

    it('test with error: should finish test with error in description', function () {
      reporter = createAndPrepareReporter();
      const spyFinishTestItem = jest.spyOn(reporter.rpClient, 'finishTestItem');
      const currentTest = {
        tempId: 'testItemId',
        err: {
          stack: 'Error: test failed\n    at test.js:10:5',
        },
      };
      reporter.testsInfo.set('testItemId', {
        description: 'test description',
      });

      const expectedTestFinishObj = {
        endTime: mockedDate,
        retry: false,
        status: 'failed',
        description: 'test description\n```error\nError: test failed\n    at test.js:10:5\n```',
      };
      reporter.activeTests.set(currentTest, currentTest);

      reporter.finishTest(currentTest, testStatuses.FAILED);

      expect(spyFinishTestItem).toHaveBeenCalledWith('testItemId', expectedTestFinishObj);
    });

    it('skippedIssue=false with skipped test: should finish test with NOT_ISSUE', function () {
      reporter = createAndPrepareReporter({
        skippedIssue: false,
      });
      const spyFinishTestItem = jest.spyOn(reporter.rpClient, 'finishTestItem');
      const currentTest = {
        tempId: 'testItemId',
      };

      const expectedTestFinishObj = {
        endTime: mockedDate,
        retry: false,
        status: 'skipped',
        issue: {
          issueType: 'NOT_ISSUE',
        },
      };
      reporter.activeTests.set(currentTest, currentTest);

      reporter.finishTest(currentTest, testStatuses.SKIPPED);

      expect(spyFinishTestItem).toHaveBeenCalledWith('testItemId', expectedTestFinishObj);
    });

    it('skippedIssue=false with passed test: should finish test without NOT_ISSUE', function () {
      reporter = createAndPrepareReporter({
        skippedIssue: false,
      });
      const spyFinishTestItem = jest.spyOn(reporter.rpClient, 'finishTestItem');
      const currentTest = {
        tempId: 'testItemId',
      };

      const expectedTestFinishObj = {
        endTime: mockedDate,
        retry: false,
        status: 'passed',
      };
      reporter.activeTests.set(currentTest, currentTest);

      reporter.finishTest(currentTest, testStatuses.PASSED);

      expect(spyFinishTestItem).toHaveBeenCalledWith('testItemId', expectedTestFinishObj);
    });

    it('test with error and no description: should finish test with error description', function () {
      reporter = createAndPrepareReporter();
      const spyFinishTestItem = jest.spyOn(reporter.rpClient, 'finishTestItem');
      const currentTest = {
        tempId: 'testItemId',
        err: {
          stack: 'Error: test failed\n    at test.js:10:5',
        },
      };

      const expectedTestFinishObj = {
        endTime: mockedDate,
        retry: false,
        status: 'failed',
        description: '\n```error\nError: test failed\n    at test.js:10:5\n```',
      };
      reporter.activeTests.set(currentTest, currentTest);

      reporter.finishTest(currentTest, testStatuses.FAILED);

      expect(spyFinishTestItem).toHaveBeenCalledWith('testItemId', expectedTestFinishObj);
    });
  });

  describe('test event listeners', function () {
    beforeAll(function () {
      reporter = createAndPrepareReporter();
    });

    afterEach(function () {
      reporter.activeTests.clear();
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
        reporter.activeTests.set(currentTest, currentTest);

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
        reporter.activeTests.set(currentTest, currentTest);

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
        reporter.activeTests.set(currentTest, currentTest);

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
        reporter.activeTests.set(currentTest, currentTest);

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
        reporter.activeTests.set(currentTest, currentTest);
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

  describe('getTestItemId', function () {
    it('should return tempId when testInfo exists', function () {
      reporter = createAndPrepareReporter();
      const test = { title: 'test' };
      const testInfo = { tempId: 'testTempId' };
      reporter.activeTests.set(test, testInfo);

      const result = reporter.getTestItemId(test);

      expect(result).toBe('testTempId');
    });

    it('should return current suite ID when testInfo does not exist', function () {
      reporter = createAndPrepareReporter();
      reporter.suitesStackTempId = ['tempSuiteId'];
      const test = { title: 'test' };

      const result = reporter.getTestItemId(test);

      expect(result).toBe('tempSuiteId');
    });
  });

  describe('onAddAttributes', function () {
    it('should add attributes to existing testInfo.attributes', function () {
      reporter = createAndPrepareReporter();
      const currentTest = {
        title: 'test',
        tempId: 'testItemId',
      };
      reporter.activeTests.set(currentTest, currentTest);
      reporter.testsInfo.set('testItemId', {
        attributes: [{ key: 'existing', value: 'value' }],
      });
      const newAttributes = [{ key: 'new', value: 'value' }];

      reporter.onAddAttributes({ attributes: newAttributes });

      expect(reporter.testsInfo.get('testItemId').attributes).toEqual([
        { key: 'existing', value: 'value' },
        { key: 'new', value: 'value' },
      ]);
    });

    it('should initialize attributes array when testInfo.attributes is null', function () {
      reporter = createAndPrepareReporter();
      const currentTest = {
        title: 'test',
        tempId: 'testItemId',
      };
      reporter.activeTests.set(currentTest, currentTest);
      reporter.testsInfo.set('testItemId', {
        description: 'test description',
        // attributes is not set, so it will be undefined
      });
      const newAttributes = [{ key: 'new', value: 'value' }];

      reporter.onAddAttributes({ attributes: newAttributes });

      expect(reporter.testsInfo.get('testItemId').attributes).toEqual([
        { key: 'new', value: 'value' },
      ]);
    });

    it('should return attributes map via getter', function () {
      reporter = createAndPrepareReporter();
      reporter.testsInfo.set('testItemId1', {
        attributes: [{ key: 'attr1', value: 'value1' }],
      });
      reporter.testsInfo.set('testItemId2', {
        attributes: [{ key: 'attr2', value: 'value2' }],
      });
      reporter.testsInfo.set('testItemId3', {
        description: 'no attributes',
      });

      const attributesMap = reporter.attributes;

      expect(attributesMap).toBeInstanceOf(Map);
      expect(attributesMap.get('testItemId1')).toEqual({
        attributes: [{ key: 'attr1', value: 'value1' }],
      });
      expect(attributesMap.get('testItemId2')).toEqual({
        attributes: [{ key: 'attr2', value: 'value2' }],
      });
      expect(attributesMap.has('testItemId3')).toBe(false);
    });
  });

  describe('getHookStartTime', function () {
    const utils = require('./../lib/utils');
    const { entityType } = require('./../lib/constants/itemTypes');

    beforeEach(() => {
      utils.getBeforeHookStartTime.mockReset();
      reporter = createAndPrepareReporter();
    });

    it('returns hookTime for BEFORE_METHOD when parent start time missing', function () {
      utils.getBeforeHookStartTime.mockReturnValue('beforeHookTime');
      const test = { startTime: mockedDate };
      reporter.activeTests.set(test, { startTime: mockedDate });

      const result = reporter.getHookStartTime({ parent: {} }, entityType.BEFORE_METHOD, {});

      expect(result).toBe('beforeHookTime');
      expect(utils.getBeforeHookStartTime).toHaveBeenCalledWith(mockedDate);
    });

    it('returns earlier parent start for BEFORE_SUITE comparison branch', function () {
      utils.getBeforeHookStartTime.mockReturnValue('2020-05-22T15:31:00.000Z');
      const parent = {};
      reporter.suitesInfo.set(parent, { startTime: '2020-05-22T15:30:00.000Z' });
      const hookParent = {};
      reporter.suitesInfo.set(hookParent, { startTime: '2020-05-22T15:29:00.000Z' });

      const result = reporter.getHookStartTime(
        { parent: hookParent },
        entityType.BEFORE_SUITE,
        parent,
      );

      expect(result).toBe('2020-05-22T15:30:00.000Z');
      expect(utils.getBeforeHookStartTime).toHaveBeenCalledWith('2020-05-22T15:29:00.000Z');
    });
  });
});
