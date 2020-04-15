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
  }

  getCurrentTestItemId() {
    return (this.currentTest && this.currentTest.tempId) || this.getCurrentSuiteId();
  }

  onSetDescription({ text }) {
    const testItemId = this.getCurrentTestItemId();
    this.descriptions.set(testItemId, text);
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
    this.rpClient.sendLog(
      tempId,
      {
        message,
        level,
        time: this.rpClient.helpers.now(),
      },
      file,
    );
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
    try {
      const systemAttributes = this.getSystemAttributes();
      const launchesAttributes = (this.options.reporterOptions.attributes || []).concat(
        systemAttributes,
      );
      const launchObj = this.rpClient.startLaunch({
        token: this.options.reporterOptions.token,
        name: this.options.reporterOptions.launch,
        startTime: this.rpClient.helpers.now(),
        description: this.options.reporterOptions.description,
        rerun: this.options.reporterOptions.rerun,
        rerunOf: this.options.reporterOptions.rerunOf,
        attributes: launchesAttributes,
      });
      this.launchId = launchObj.tempId;
    } catch (err) {
      console.log('Failed to launch run. Error:', err);
    }
  }

  onLaunchFinish() {
    try {
      this.rpClient.finishLaunch(this.launchId, {
        endTime: this.rpClient.helpers.now(),
      });
    } catch (err) {
      console.log('Failed to finish run. Error:', err);
    }
  }

  onSuiteStart(suite) {
    try {
      if (!suite.root) {
        if (this.suiteIds.has(suite.parent)) {
          const parentId = this.suiteIds.get(suite.parent);
          const codeRef = getCodeRef(suite);
          const suiteObj = this.rpClient.startTestItem(
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
          this.suitesStackTempId.push(suiteObj.tempId);
          if (!this.suiteIds.has(suite)) {
            this.suiteIds.set(suite, suiteObj.tempId);
          }
        }
      } else {
        this.suiteIds.set(suite, undefined);
      }
    } catch (err) {
      console.log('Failed to create suite. Error:', err);
    }
  }

  onSuiteFinish(suite) {
    try {
      const suiteId = this.suiteIds.get(suite);
      if (suiteId) {
        const suiteAttributes = this.attributes.get(suiteId);
        const suiteDescription = this.descriptions.get(suiteId);
        const suiteFinishObj = Object.assign(
          {
            endTime: this.rpClient.helpers.now(),
          },
          suiteAttributes && { attributes: suiteAttributes },
          suiteDescription && { description: suiteDescription },
        );
        this.rpClient.finishTestItem(suiteId, suiteFinishObj);
        this.attributes.delete(suiteId);
        this.descriptions.delete(suiteId);
      }
      this.suitesStackTempId.pop();
    } catch (err) {
      console.log('Failed to finish suite. Error:', err);
    }
  }

  onTestStart(test) {
    try {
      // eslint-disable-next-line no-underscore-dangle
      const isRetry = test._retries > 0;
      if (isRetry && this.currentTest) {
        this.finishTest(this.currentTest, testStatuses.FAILED);
      }
      const parentId = this.suiteIds.get(test.parent);
      const codeRef = getCodeRef(test);
      const { tempId } = this.rpClient.startTestItem(
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
      this.currentTest = { ...test, tempId };
    } catch (err) {
      console.log('Failed to create child item. Error:', err);
    }
  }

  onTestFinish(test) {
    const status = test.state || (test.pending && testStatuses.SKIPPED) || testStatuses.PASSED;
    this.finishTest(test, status);
  }

  finishTest(test, status) {
    try {
      if (this.currentTest) {
        const testAttributes = this.attributes.get(this.currentTest.tempId);
        const testDescription = this.descriptions.get(this.currentTest.tempId);
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
        );
        this.rpClient.finishTestItem(this.currentTest.tempId, testFinishObj);
        this.attributes.delete(this.currentTest.tempId);
        this.descriptions.delete(this.currentTest.tempId);
        this.currentTest = null;
      }
    } catch (err) {
      console.log('Failed to finish child item. Error:', err);
    }
  }

  onHookStart(hook) {
    if (!this.options.reporterOptions.reportHooks) return;
    try {
      const hookTypeRegEx = new RegExp(Object.values(hookTypes).join('|'));
      const hookMochaType = hookTypeRegEx.exec(hook.title)[0];
      const hookRPType = hookTypesMap[hookMochaType];
      const hookName = hook.title.replace(`"${hookMochaType}" hook:`, '').trim();
      const parent = [entityType.BEFORE_SUITE, entityType.AFTER_SUITE].includes(hookRPType)
        ? hook.parent && hook.parent.parent
        : hook.parent;
      const parentId = this.suiteIds.get(parent);
      const { tempId } = this.rpClient.startTestItem(
        {
          name: hookName,
          startTime: this.rpClient.helpers.now(),
          type: hookRPType,
        },
        this.launchId,
        parentId,
      );
      this.hookIds.set(hook, tempId);
    } catch (err) {
      console.error('Failed to create hook. Error:', err);
    }
  }

  onHookFinish(hook, status) {
    if (!this.options.reporterOptions.reportHooks) return;
    try {
      const hookId = this.hookIds.get(hook);
      if (hookId) {
        this.hookIds.delete(hook);
        this.rpClient.finishTestItem(hookId, {
          status: status || hook.state,
          endTime: this.rpClient.helpers.now(),
        });
      }
    } catch (err) {
      console.error('Failed to finish hook. Error:', err);
    }
  }

  onTestPending(test) {
    try {
      this.onTestStart(test);
      this.finishTest(test, testStatuses.SKIPPED);
    } catch (err) {
      console.log('Failed to report child pending item. Error:', err);
    }
  }

  onTestFail(test, err) {
    try {
      if (this.currentTest) {
        this.rpClient.sendLog(this.currentTest.tempId, {
          level: logLevels.ERROR,
          message: err.stack || err.message || err.toString(),
        });
      }
    } catch (error) {
      console.log('Failed to send log for item. Error:', error);
    }
    if (test.type === 'hook') {
      if (this.options.reporterOptions.reportHooks) {
        this.onHookFinish(test, testStatuses.FAILED);
      }
      if (test.ctx && test.ctx.currentTest) {
        this.finishTest(test.ctx.currentTest, testStatuses.SKIPPED);
      }
    }
  }

  getCurrentSuiteId() {
    return this.suitesStackTempId.length
      ? this.suitesStackTempId[this.suitesStackTempId.length - 1]
      : undefined;
  }
}

module.exports = ReportportalAgent;
