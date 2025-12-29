/*
 *  Copyright 2024 EPAM Systems
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

const Mocha = require('mocha');
const RPClient = require('@reportportal/client-javascript');
const clientHelpers = require('@reportportal/client-javascript/lib/helpers');
const { EVENTS } = require('@reportportal/client-javascript/lib/constants/events');

const { entityType, hookTypes, hookTypesMap } = require('./constants/itemTypes');
const logLevels = require('./constants/logLevels');
const testStatuses = require('./constants/testStatuses');
const { getCodeRef, getAgentInfo, parseAttributes, getBeforeHookStartTime } = require('./utils');

const {
  EVENT_RUN_BEGIN,
  EVENT_RUN_END,
  EVENT_TEST_BEGIN,
  EVENT_TEST_FAIL,
  EVENT_TEST_END,
  EVENT_TEST_PENDING,
  EVENT_SUITE_BEGIN,
  EVENT_SUITE_END,
  EVENT_HOOK_BEGIN,
  EVENT_HOOK_END,
} = Mocha.Runner.constants;

const promiseErrorHandler = (promise, message = '') =>
  promise.catch((err) => {
    console.error(message, err);
  });

class ReportportalAgent extends Mocha.reporters.Base {
  constructor(runner, options) {
    super(runner, options);
    const reporterOptions = options.reporterOptions || {};
    this.options = {
      ...options,
      reporterOptions: {
        ...reporterOptions,
        extendTestDescriptionWithLastError:
          String(reporterOptions.extendTestDescriptionWithLastError).toLowerCase() !== 'false',
      },
    };
    const agentInfo = getAgentInfo();
    this.rpClient = new RPClient(
      {
        ...this.options.reporterOptions,
        skippedIsNotIssue: this.options.reporterOptions.skippedIssue === false,
      },
      agentInfo,
    );
    this.suitesInfo = new Map();
    this.hookIds = new Map();
    this.activeTests = new Map(); // Replace single currentTest with Map for parallel support
    this.suitesStackTempId = [];
    this.testsInfo = new Map(); // Combined Map for all test-related data
    this.registerRPListeners();

    runner.on(EVENT_RUN_BEGIN, () => this.onLaunchStart());

    runner.on(EVENT_RUN_END, () => this.onLaunchFinish());

    runner.on(EVENT_SUITE_BEGIN, (suite) => this.onSuiteStart(suite));

    runner.on(EVENT_SUITE_END, (suite) => this.onSuiteFinish(suite));

    runner.on(EVENT_TEST_BEGIN, (test) => this.onTestStart(test));

    runner.on(EVENT_TEST_FAIL, (test, err) => this.onTestFail(test, err));

    runner.on(EVENT_TEST_PENDING, (test) => this.onTestPending(test));

    runner.on(EVENT_TEST_END, (test) => this.onTestFinish(test));

    runner.on(EVENT_HOOK_BEGIN, (hook) => this.onHookStart(hook));

    runner.on(EVENT_HOOK_END, (hook) => this.onHookFinish(hook, testStatuses.PASSED));
  }

  registerRPListeners() {
    process.on(EVENTS.ADD_LOG, this.sendTestItemLog.bind(this));
    process.on(EVENTS.ADD_LAUNCH_LOG, this.sendLaunchLog.bind(this));
    process.on(EVENTS.ADD_ATTRIBUTES, this.onAddAttributes.bind(this));
    process.on(EVENTS.SET_DESCRIPTION, this.onSetDescription.bind(this));
    process.on(EVENTS.SET_TEST_CASE_ID, this.onSetTestCaseId.bind(this));
    process.on(EVENTS.SET_STATUS, this.setStatus.bind(this));
    process.on(EVENTS.SET_LAUNCH_STATUS, this.setLaunchStatus.bind(this));
  }

  getCurrentTestItemId() {
    // For backward compatibility, try to get the most recent active test
    // In parallel mode, this might not be accurate, so we'll use the suite ID as fallback
    const activeTestInfos = Array.from(this.activeTests.values());
    const mostRecentTestInfo = activeTestInfos[activeTestInfos.length - 1];
    return (mostRecentTestInfo && mostRecentTestInfo.tempId) || this.getCurrentSuiteId();
  }

  getTestItemId(test) {
    const testInfo = this.activeTests.get(test);
    return testInfo ? testInfo.tempId : this.getCurrentSuiteId();
  }

  onSetDescription({ text }) {
    const testItemId = this.getCurrentTestItemId();
    if (!this.testsInfo.has(testItemId)) {
      this.testsInfo.set(testItemId, {});
    }
    this.testsInfo.get(testItemId).description = text;
  }

  onSetTestCaseId({ testCaseId }) {
    const testItemId = this.getCurrentTestItemId();
    if (!this.testsInfo.has(testItemId)) {
      this.testsInfo.set(testItemId, {});
    }
    this.testsInfo.get(testItemId).testCaseId = testCaseId;
  }

  onAddAttributes({ attributes }) {
    if (!attributes || !(attributes instanceof Array)) {
      console.error('Attributes should be instance of Array');
      return;
    }
    const testItemId = this.getCurrentTestItemId();
    if (!this.testsInfo.has(testItemId)) {
      this.testsInfo.set(testItemId, { attributes: [] });
    }
    const testInfo = this.testsInfo.get(testItemId);
    if (!testInfo.attributes) {
      testInfo.attributes = [];
    }
    testInfo.attributes = testInfo.attributes.concat(attributes);
  }

  sendTestItemLog({ log }) {
    this.sendLog(this.getCurrentTestItemId(), log);
  }

  sendLaunchLog({ log }) {
    this.sendLog(this.launchId, log);
  }

  sendLog(tempId, { level, message = '', file }) {
    const { promise } = this.rpClient.sendLog(
      tempId,
      {
        message,
        level,
        time: clientHelpers.now(),
      },
      file,
    );
    promiseErrorHandler(promise, 'Failed to send log.');
  }

  setStatus({ status }) {
    const testItemId = this.getCurrentTestItemId();
    if (!this.testsInfo.has(testItemId)) {
      this.testsInfo.set(testItemId, {});
    }
    this.testsInfo.get(testItemId).status = status;
  }

  setLaunchStatus(status) {
    this.launchStatus = status;
  }

  getSystemAttributes() {
    const agentInfo = getAgentInfo();
    const systemAttributes = [
      {
        key: 'agent',
        value: `${agentInfo.name}|${agentInfo.version}`,
        system: true,
      },
    ];
    return systemAttributes;
  }

  onLaunchStart() {
    const systemAttributes = this.getSystemAttributes();
    const attributes = parseAttributes(this.options.reporterOptions.attributes);
    const launchAttributes = (attributes || []).concat(systemAttributes);
    const { tempId, promise } = this.rpClient.startLaunch({
      name: this.options.reporterOptions.launch,
      startTime: clientHelpers.now(),
      description: this.options.reporterOptions.description,
      mode: this.options.reporterOptions.mode,
      rerun: this.options.reporterOptions.rerun,
      rerunOf: this.options.reporterOptions.rerunOf,
      attributes: launchAttributes,
    });
    promiseErrorHandler(promise, 'Failed to launch run.');
    this.launchId = tempId;
  }

  onLaunchFinish() {
    const { promise } = this.rpClient.finishLaunch(
      this.launchId,
      Object.assign(
        {
          endTime: clientHelpers.now(),
        },
        this.launchStatus && { status: this.launchStatus },
      ),
    );
    promiseErrorHandler(promise, 'Failed to finish run.');
  }

  onSuiteStart(suite) {
    if (!suite.root) {
      if (this.suitesInfo.has(suite.parent)) {
        const parentId = this.getSuiteTempId(suite.parent);
        const codeRef = getCodeRef(suite);
        const suiteObj = {
          name: suite.title,
          startTime: clientHelpers.now(),
          attributes: [],
          type: entityType.SUITE,
          codeRef,
        };
        const { tempId, promise } = this.rpClient.startTestItem(suiteObj, this.launchId, parentId);
        promiseErrorHandler(promise, 'Failed to create suite.');
        this.suitesStackTempId.push(tempId);
        if (!this.suitesInfo.has(suite)) {
          this.suitesInfo.set(suite, { tempId, startTime: suiteObj.startTime });
        }
      }
    } else {
      this.suitesInfo.set(suite, undefined);
    }
  }

  onSuiteFinish(suite) {
    const suiteId = this.getSuiteTempId(suite);
    if (suiteId) {
      const { attributes, description, testCaseId, status } = this.testsInfo.get(suiteId) || {};
      const suiteFinishObj = Object.assign(
        {
          endTime: clientHelpers.now(),
        },
        attributes && { attributes },
        description && { description },
        testCaseId && { testCaseId },
        status && { status },
      );
      const { promise } = this.rpClient.finishTestItem(suiteId, suiteFinishObj);
      promiseErrorHandler(promise, 'Failed to finish suite.');
      this.testsInfo.delete(suiteId);
    }
    this.suitesStackTempId.pop();
  }

  onTestStart(test) {
    // eslint-disable-next-line no-underscore-dangle
    const isRetry = test._retries > 0;
    if (isRetry && this.activeTests.has(test)) {
      this.finishTest(test, testStatuses.FAILED);
    }
    const parentId = this.getSuiteTempId(test.parent);
    const codeRef = getCodeRef(test);
    const testObj = {
      name: test.title,
      startTime: clientHelpers.now(),
      attributes: [],
      type: entityType.STEP,
      retry: isRetry,
      codeRef,
    };
    const { tempId, promise } = this.rpClient.startTestItem(testObj, this.launchId, parentId);
    promiseErrorHandler(promise, 'Failed to create child item.');
    const testInfo = { ...test, tempId, startTime: testObj.startTime };
    this.activeTests.set(test, testInfo);
  }

  onTestFinish(test) {
    const status = test.state || (test.pending && testStatuses.SKIPPED) || testStatuses.PASSED;
    this.finishTest(test, status);
  }

  finishTest(test, autoStatus) {
    const testInfo = this.activeTests.get(test);
    if (!testInfo) return;

    const { tempId } = testInfo;
    const { attributes, description, testCaseId, status } = this.testsInfo.get(tempId) || {};

    const shouldExtendDescription =
      test.err && this.options.reporterOptions.extendTestDescriptionWithLastError;
    const finalDescription = shouldExtendDescription
      ? `${description || ''}\n\`\`\`error\n${test.err.stack}\n\`\`\``
      : description;

    const finalStatus = status || autoStatus;

    const testFinishObj = {
      endTime: clientHelpers.now(),
      // eslint-disable-next-line no-underscore-dangle
      retry: test._retries > 0,
      status: finalStatus,
      ...(attributes && { attributes }),
      ...(finalDescription && { description: finalDescription }),
      ...(testCaseId && { testCaseId }),
    };

    const { promise } = this.rpClient.finishTestItem(tempId, testFinishObj);
    promiseErrorHandler(promise, 'Failed to finish child item.');

    this.testsInfo.delete(tempId);
    this.activeTests.delete(test);
  }

  getHookStartTime(hook, hookRPType, parent) {
    const parentSuite = this.suitesInfo.get(parent);
    const currentParentStartTime = (parentSuite && parentSuite.startTime) || 0;

    if (hookRPType === entityType.BEFORE_METHOD) {
      // In parallel mode, we need to find the most recent active test
      const activeTests = Array.from(this.activeTests.values());
      const mostRecentTest = activeTests[activeTests.length - 1];
      if (mostRecentTest) {
        // getBeforeHookStartTime returns a string, currentParentStartTime may be string or 0
        // Always return the earlier ISO string
        const hookTime = getBeforeHookStartTime(mostRecentTest.startTime);
        if (typeof currentParentStartTime === 'string') {
          return hookTime < currentParentStartTime ? hookTime : currentParentStartTime;
        }
        return hookTime;
      }
    }

    if (hookRPType === entityType.BEFORE_SUITE) {
      const hookSuite = this.suitesInfo.get(hook.parent);
      const hookStartTime = (hookSuite && hookSuite.startTime) || clientHelpers.now();
      if (typeof currentParentStartTime === 'string') {
        const hookTime = getBeforeHookStartTime(hookStartTime);
        return hookTime < currentParentStartTime ? hookTime : currentParentStartTime;
      }
      return getBeforeHookStartTime(hookStartTime);
    }

    // Default: return ISO string
    return clientHelpers.now();
  }

  onHookStart(hook) {
    if (!this.options.reporterOptions.reportHooks) return;
    const hookTypeRegEx = new RegExp(Object.values(hookTypes).join('|'));
    const hookMochaType = hookTypeRegEx.exec(hook.title)[0];
    const hookRPType = hookTypesMap[hookMochaType];
    const hookName = hook.title.replace(`"${hookMochaType}" hook:`, '').trim();
    const parent = [entityType.BEFORE_SUITE, entityType.AFTER_SUITE].includes(hookRPType)
      ? hook.parent && hook.parent.parent
      : hook.parent;
    const hookStartObj = {
      name: hookName,
      startTime: this.getHookStartTime(hook, hookRPType, parent),
      type: hookRPType,
    };

    const parentId = this.getSuiteTempId(parent);
    const { tempId, promise } = this.rpClient.startTestItem(hookStartObj, this.launchId, parentId);
    promiseErrorHandler(promise, 'Failed to start hook.');
    this.hookIds.set(hook, tempId);
  }

  onHookFinish(hook, status, error) {
    if (!this.options.reporterOptions.reportHooks) return;
    const hookId = this.hookIds.get(hook);
    if (hookId) {
      if (error) {
        this.sendError(hookId, error);
      }
      this.hookIds.delete(hook);
      const { promise } = this.rpClient.finishTestItem(hookId, {
        status: status || hook.state,
        endTime: clientHelpers.now(),
      });
      promiseErrorHandler(promise, 'Failed to finish hook');
    }
  }

  onTestPending(test) {
    if (!this.activeTests.has(test)) {
      this.onTestStart(test);
    }
    this.finishTest(test, testStatuses.SKIPPED);
  }

  onTestFail(test, err) {
    const testInfo = this.activeTests.get(test);
    if (testInfo) {
      this.sendError(testInfo.tempId, err);
    }
    if (test.type === 'hook') {
      if (this.options.reporterOptions.reportHooks) {
        this.onHookFinish(test, testStatuses.FAILED, err);
      }
      if (test.ctx && test.ctx.currentTest) {
        // Send error log to the current test's tempId for legacy compatibility
        const currentTestInfo = this.activeTests.get(test.ctx.currentTest);
        if (currentTestInfo) {
          this.sendError(currentTestInfo.tempId, err);
        }
        this.finishTest(test.ctx.currentTest, testStatuses.SKIPPED);
      }
    }
  }

  sendError(tempItemId, err) {
    const { promise } = this.rpClient.sendLog(tempItemId, {
      level: logLevels.ERROR,
      message: err.stack || err.message || err.toString(),
    });
    promiseErrorHandler(promise, 'Failed to send error log');
  }

  getCurrentSuiteId() {
    return this.suitesStackTempId.length
      ? this.suitesStackTempId[this.suitesStackTempId.length - 1]
      : undefined;
  }

  getSuiteTempId(suite) {
    const suiteInfo = this.suitesInfo.get(suite);
    return suiteInfo && suiteInfo.tempId;
  }

  // Legacy compatibility: attributes Map
  get attributes() {
    // Return a Map of testItemId => { attributes } for all items in testsInfo that have attributes
    const map = new Map();
    Array.from(this.testsInfo.entries()).forEach(([key, value]) => {
      if (value && value.attributes) {
        map.set(key, { attributes: value.attributes });
      }
    });
    return map;
  }
}

module.exports = ReportportalAgent;
