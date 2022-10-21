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

const Mocha = require('mocha');
const RPClient = require('@reportportal/client-javascript');
const { EVENTS } = require('@reportportal/client-javascript/lib/constants/events');

const { entityType, hookTypes, hookTypesMap } = require('./constants/itemTypes');
const logLevels = require('./constants/logLevels');
const testStatuses = require('./constants/testStatuses');
const { getCodeRef, getAgentInfo, parseStringToArray } = require('./utils');

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
    const agentInfo = getAgentInfo();
    this.rpClient = new RPClient(options.reporterOptions, agentInfo);
    this.suitesInfo = new Map();
    this.hookIds = new Map();
    this.currentTest = null;
    this.suitesStackTempId = [];
    this.attributes = new Map();
    this.descriptions = new Map();
    this.testCaseIds = new Map();
    this.testItemStatuses = new Map();
    this.options = options;
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
    return (this.currentTest && this.currentTest.tempId) || this.getCurrentSuiteId();
  }

  onSetDescription({ text }) {
    const testItemId = this.getCurrentTestItemId();
    this.descriptions.set(testItemId, text);
  }

  onSetTestCaseId({ testCaseId }) {
    const testItemId = this.getCurrentTestItemId();
    this.testCaseIds.set(testItemId, testCaseId);
  }

  onAddAttributes({ attributes }) {
    if (!attributes || !(attributes instanceof Array)) {
      console.error('Attributes should be instance of Array');
      return;
    }
    const testItemId = this.getCurrentTestItemId();
    const testItemAttributes = (this.attributes.get(testItemId) || []).concat(attributes);
    this.attributes.set(testItemId, testItemAttributes);
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
        time: this.rpClient.helpers.now(),
      },
      file,
    );
    promiseErrorHandler(promise, 'Failed to send log.');
  }

  setStatus({ status }) {
    const testItemId = this.getCurrentTestItemId();
    this.testItemStatuses.set(testItemId, status);
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
    if ([false, 'false'].includes(this.options.reporterOptions.skippedIssue)) {
      this.options.reporterOptions.skippedIssue = false;
      const skippedIssueAttribute = {
        key: 'skippedIssue',
        value: 'false',
        system: true,
      };
      systemAttributes.push(skippedIssueAttribute);
    }
    return systemAttributes;
  }

  onLaunchStart() {
    const systemAttributes = this.getSystemAttributes();
    const attributes = parseStringToArray(this.options.reporterOptions.attributes);
    const launchAttributes = (attributes || []).concat(systemAttributes);
    const { tempId, promise } = this.rpClient.startLaunch({
      token: this.options.reporterOptions.token,
      name: this.options.reporterOptions.launch,
      startTime: this.rpClient.helpers.now(),
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
          endTime: this.rpClient.helpers.now(),
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
          startTime: this.rpClient.helpers.now(),
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
      const suiteAttributes = this.attributes.get(suiteId);
      const suiteDescription = this.descriptions.get(suiteId);
      const suiteTestCaseId = this.testCaseIds.get(suiteId);
      const suiteStatus = this.testItemStatuses.get(suiteId);
      const suiteFinishObj = Object.assign(
        {
          endTime: this.rpClient.helpers.now(),
        },
        suiteAttributes && { attributes: suiteAttributes },
        suiteDescription && { description: suiteDescription },
        suiteTestCaseId && { testCaseId: suiteTestCaseId },
        suiteStatus && { status: suiteStatus },
      );
      const { promise } = this.rpClient.finishTestItem(suiteId, suiteFinishObj);
      promiseErrorHandler(promise, 'Failed to finish suite.');
      this.attributes.delete(suiteId);
      this.descriptions.delete(suiteId);
      this.testCaseIds.delete(suiteId);
    }
    this.suitesStackTempId.pop();
  }

  onTestStart(test) {
    // eslint-disable-next-line no-underscore-dangle
    const isRetry = test._retries > 0;
    if (isRetry && this.currentTest) {
      this.finishTest(this.currentTest, testStatuses.FAILED);
    }
    const parentId = this.getSuiteTempId(test.parent);
    const codeRef = getCodeRef(test);
    const testObj = {
      name: test.title,
      startTime: this.rpClient.helpers.now(),
      attributes: [],
      type: entityType.STEP,
      retry: isRetry,
      codeRef,
    };
    const { tempId, promise } = this.rpClient.startTestItem(testObj, this.launchId, parentId);
    promiseErrorHandler(promise, 'Failed to create child item.');
    this.currentTest = { ...test, tempId, startTime: testObj.startTime };
  }

  onTestFinish(test) {
    const status = test.state || (test.pending && testStatuses.SKIPPED) || testStatuses.PASSED;
    this.finishTest(test, status);
  }

  finishTest(test, autoStatus) {
    if (this.currentTest) {
      const testAttributes = this.attributes.get(this.currentTest.tempId);
      let testDescription = this.descriptions.get(this.currentTest.tempId);
      if (test.err) {
        testDescription = (testDescription || '').concat(
          `\n\`\`\`error\n${test.err.stack}\n\`\`\``,
        );
      }
      const testCaseId = this.testCaseIds.get(this.currentTest.tempId);
      const testStatus = this.testItemStatuses.get(this.currentTest.tempId) || autoStatus;
      const withoutIssue =
        testStatus === testStatuses.SKIPPED && this.options.reporterOptions.skippedIssue === false;
      const testFinishObj = Object.assign(
        {
          endTime: this.rpClient.helpers.now(),
          // eslint-disable-next-line no-underscore-dangle
          retry: test._retries > 0,
          status: testStatus,
        },
        withoutIssue && { issue: { issueType: 'NOT_ISSUE' } },
        testAttributes && { attributes: testAttributes },
        testDescription && { description: testDescription },
        testCaseId && { testCaseId },
      );
      const { promise } = this.rpClient.finishTestItem(this.currentTest.tempId, testFinishObj);
      promiseErrorHandler(promise, 'Failed to finish child item.');
      this.attributes.delete(this.currentTest.tempId);
      this.descriptions.delete(this.currentTest.tempId);
      this.testCaseIds.delete(this.currentTest.tempId);
      this.currentTest = null;
    }
  }

  getHookStartTime(hook, hookRPType, parent) {
    const parentSuite = this.suitesInfo.get(parent);
    const currentParentStartTime = (parentSuite && parentSuite.startTime) || 0;

    if (hookRPType === entityType.BEFORE_METHOD && this.currentTest) {
      return Math.max(this.currentTest.startTime - 1, currentParentStartTime);
    }

    if (hookRPType === entityType.BEFORE_SUITE) {
      const hookSuite = this.suitesInfo.get(hook.parent);
      const hookStartTime = (hookSuite && hookSuite.startTime) || this.rpClient.helpers.now();
      return Math.max(hookStartTime - 1, currentParentStartTime);
    }

    return this.rpClient.helpers.now();
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
        endTime: this.rpClient.helpers.now(),
      });
      promiseErrorHandler(promise, 'Failed to finish hook');
    }
  }

  onTestPending(test) {
    if (this.currentTest === null) {
      this.onTestStart(test);
    }
    this.finishTest(test, testStatuses.SKIPPED);
  }

  onTestFail(test, err) {
    if (this.currentTest) {
      this.sendError(this.currentTest.tempId, err);
    }
    if (test.type === 'hook') {
      if (this.options.reporterOptions.reportHooks) {
        this.onHookFinish(test, testStatuses.FAILED, err);
      }
      if (test.ctx && test.ctx.currentTest) {
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
}

module.exports = ReportportalAgent;
