const Mocha = require('mocha');
const RPClient = require('reportportal-client');
const { EVENTS } = require('reportportal-client/lib/events');

const { entityType, hookTypes, hookTypesMap } = require('./constants/itemTypes');
const logLevels = require('./constants/logLevels');
const testStatuses = require('./constants/testStatuses');
const { getCodeRef, getAgentInfo } = require('./utils');

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
    this.suiteIds = new Map();
    this.hookIds = new Map();
    this.currentTest = null;
    this.suitesStackTempId = [];
    this.attributes = new Map();
    this.descriptions = new Map();
    this.testCaseIds = new Map();
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

  getSystemAttributes() {
    const agentInfo = getAgentInfo();
    const systemAttributes = [
      {
        key: 'agent',
        value: `${agentInfo.name}|${agentInfo.version}`,
        system: true,
      },
    ];
    if (this.options.reporterOptions.skippedIssue === false) {
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
    const launchAttributes = (this.options.reporterOptions.attributes || []).concat(
      systemAttributes,
    );
    const { tempId, promise } = this.rpClient.startLaunch({
      token: this.options.reporterOptions.token,
      name: this.options.reporterOptions.launch,
      startTime: this.rpClient.helpers.now(),
      description: this.options.reporterOptions.description,
      rerun: this.options.reporterOptions.rerun,
      rerunOf: this.options.reporterOptions.rerunOf,
      attributes: launchAttributes,
    });
    promiseErrorHandler(promise, 'Failed to launch run.');
    this.launchId = tempId;
  }

  onLaunchFinish() {
    const { promise } = this.rpClient.finishLaunch(this.launchId, {
      endTime: this.rpClient.helpers.now(),
    });
    promiseErrorHandler(promise, 'Failed to finish run.');
  }

  onSuiteStart(suite) {
    if (!suite.root) {
      if (this.suiteIds.has(suite.parent)) {
        const parentId = this.suiteIds.get(suite.parent);
        const codeRef = getCodeRef(suite);
        const { tempId, promise } = this.rpClient.startTestItem(
          {
            name: suite.title,
            startTime: this.rpClient.helpers.now(),
            attributes: [],
            type: entityType.SUITE,
            codeRef,
          },
          this.launchId,
          parentId,
        );
        promiseErrorHandler(promise, 'Failed to create suite.');
        this.suitesStackTempId.push(tempId);
        if (!this.suiteIds.has(suite)) {
          this.suiteIds.set(suite, tempId);
        }
      }
    } else {
      this.suiteIds.set(suite, undefined);
    }
  }

  onSuiteFinish(suite) {
    const suiteId = this.suiteIds.get(suite);
    if (suiteId) {
      const suiteAttributes = this.attributes.get(suiteId);
      const suiteDescription = this.descriptions.get(suiteId);
      const suiteTestCaseId = this.testCaseIds.get(suiteId);
      const suiteFinishObj = Object.assign(
        {
          endTime: this.rpClient.helpers.now(),
        },
        suiteAttributes && { attributes: suiteAttributes },
        suiteDescription && { description: suiteDescription },
        suiteTestCaseId && { testCaseId: suiteTestCaseId },
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
    const parentId = this.suiteIds.get(test.parent);
    const codeRef = getCodeRef(test);
    const { tempId, promise } = this.rpClient.startTestItem(
      {
        name: test.title,
        startTime: this.rpClient.helpers.now(),
        attributes: [],
        type: entityType.STEP,
        retry: isRetry,
        codeRef,
      },
      this.launchId,
      parentId,
    );
    promiseErrorHandler(promise, 'Failed to create child item.');
    this.currentTest = { ...test, tempId };
  }

  onTestFinish(test) {
    const status = test.state || (test.pending && testStatuses.SKIPPED) || testStatuses.PASSED;
    this.finishTest(test, status);
  }

  finishTest(test, status) {
    if (this.currentTest) {
      const testAttributes = this.attributes.get(this.currentTest.tempId);
      const testDescription = this.descriptions.get(this.currentTest.tempId);
      const testCaseId = this.testCaseIds.get(this.currentTest.tempId);
      const withoutIssue =
        status === testStatuses.SKIPPED && this.options.reporterOptions.skippedIssue === false;
      const testFinishObj = Object.assign(
        {
          status,
          endTime: this.rpClient.helpers.now(),
          // eslint-disable-next-line no-underscore-dangle
          retry: test._retries > 0,
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

  onHookStart(hook) {
    if (!this.options.reporterOptions.reportHooks) return;
    const hookTypeRegEx = new RegExp(Object.values(hookTypes).join('|'));
    const hookMochaType = hookTypeRegEx.exec(hook.title)[0];
    const hookRPType = hookTypesMap[hookMochaType];
    const hookName = hook.title.replace(`"${hookMochaType}" hook:`, '').trim();
    const parent = [entityType.BEFORE_SUITE, entityType.AFTER_SUITE].includes(hookRPType)
      ? hook.parent && hook.parent.parent
      : hook.parent;
    const parentId = this.suiteIds.get(parent);
    const { tempId, promise } = this.rpClient.startTestItem(
      {
        name: hookName,
        startTime: this.rpClient.helpers.now(),
        type: hookRPType,
      },
      this.launchId,
      parentId,
    );
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
    this.onTestStart(test);
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
}

module.exports = ReportportalAgent;
