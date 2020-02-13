const Mocha = require('mocha');
const RPClient = require('reportportal-client');
const { entityType, hookTypes, hookTypesMap } = require('./helpers/itemTypes');
const logLevels = require('./helpers/logLevels');
const testStatuses = require('./helpers/testStatuses');

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

class RPReporter extends Mocha.reporters.Base {
  constructor(runner, options) {
    super(runner, options);
    this.rpClient = new RPClient(options.reporterOptions);
    this.suiteIds = new Map();
    this.hookIds = new Map();
    this.currentTest = null;

    runner.on(EVENT_RUN_BEGIN, () => {
      try {
        const launchObj = this.rpClient.startLaunch({
          token: options.reporterOptions.token,
          name: options.reporterOptions.launch,
          startTime: this.rpClient.helpers.now(),
          description: options.reporterOptions.description,
          rerun: options.reporterOptions.rerun,
          rerunOf: options.reporterOptions.rerunOf,
          attributes: options.attributes,
        });
        this.launchId = launchObj.tempId;
      } catch (err) {
        console.log(`Failed to launch run. Error: ${err}`);
      }
    });

    runner.on(EVENT_RUN_END, () => {
      try {
        this.rpClient.finishLaunch(this.launchId, {
          endTime: this.rpClient.helpers.now(),
        });
      } catch (err) {
        console.log(`Failed to finish run. Error: ${err}`);
      }
    });

    runner.on(EVENT_SUITE_BEGIN, (suite) => {
      try {
        if (!suite.root) {
          if (this.suiteIds.has(suite.parent)) {
            const parentId = this.suiteIds.get(suite.parent);
            const suiteObj = this.rpClient.startTestItem(
              {
                description: suite.title,
                name: suite.title,
                startTime: this.rpClient.helpers.now(),
                attributes: [],
                type: entityType.SUITE,
              },
              this.launchId,
              parentId,
            );
            if (!this.suiteIds.has(suite)) {
              this.suiteIds.set(suite, suiteObj.tempId);
            }
          }
        } else {
          this.suiteIds.set(suite, undefined);
        }
      } catch (err) {
        console.log(`Failed to create suite. Error: ${err}`);
      }
    });

    runner.on(EVENT_SUITE_END, (suite) => {
      try {
        const suiteId = this.suiteIds.get(suite);
        if (suiteId) {
          this.rpClient.finishTestItem(suiteId, {
            endTime: this.rpClient.helpers.now(),
          });
        }
      } catch (err) {
        console.log(`Failed to finish child item. Error: ${err}`);
      }
    });

    runner.on(EVENT_TEST_BEGIN, (test) => {
      try {
        this.startTest(test);
      } catch (err) {
        console.log(`Failed to create child item. Error: ${err}`);
      }
    });

    runner.on(EVENT_TEST_FAIL, async (test, err) => {
      try {
        await this.rpClient.sendLog(this.currentTest.tempId, {
          level: logLevels.ERROR,
          message: err.message || err.toString(),
        });
        if (test.type === 'hook') {
          this.finishHook(test, testStatuses.FAILED);
          if (test.ctx && test.ctx.currentTest) {
            this.finishTest(test.ctx.currentTest, testStatuses.SKIPPED);
          }
        }
      } catch (error) {
        console.log(`Failed to send log for item. Error: ${error}`);
      }
    });

    runner.on(EVENT_TEST_PENDING, async (test) => {
      try {
        const parentId = this.suiteIds.get(test.parent);
        const testObj = this.rpClient.startTestItem(
          {
            description: test.title,
            name: test.title,
            startTime: this.rpClient.helpers.now(),
            attributes: [],
            type: entityType.STEP,
          },
          this.launchId,
          parentId,
        );
        await testObj.promise;

        this.rpClient.finishTestItem(testObj.tempId, {
          status: testStatuses.SKIPPED,
          endTime: this.rpClient.helpers.now(),
        });
      } catch (err) {
        console.log(`Failed to report child pending item. Error: ${err}`);
      }
    });

    runner.on(EVENT_TEST_END, (test) => {
      try {
        const status = test.state || (test.pending && testStatuses.SKIPPED) || testStatuses.PASSED;
        this.finishTest(test, status);
      } catch (err) {
        console.log(`Failed to finish child item. Error: ${err}`);
      }
    });

    runner.on(EVENT_HOOK_BEGIN, (hook) => {
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
        console.error(`Failed to create hook. Error: ${err}`);
      }
    });

    runner.on(EVENT_HOOK_END, (hook) => {
      try {
        this.finishHook(hook, testStatuses.PASSED);
      } catch (err) {
        console.error(`Failed to finish hook. Error: ${err}`);
      }
    });
  }

  startTest(test) {
    // eslint-disable-next-line no-underscore-dangle
    const isRetry = test._retries > 0;
    if (isRetry && this.currentTest) {
      this.finishTest(this.currentTest, testStatuses.FAILED);
    }
    const parentId = this.suiteIds.get(test.parent);
    const { tempId } = this.rpClient.startTestItem(
      {
        description: test.title,
        name: test.title,
        startTime: this.rpClient.helpers.now(),
        attributes: [],
        type: entityType.STEP,
        retry: isRetry,
      },
      this.launchId,
      parentId,
    );
    this.currentTest = { ...test, tempId };
  }

  finishTest(test, status) {
    if (this.currentTest) {
      this.rpClient.finishTestItem(this.currentTest.tempId, {
        status,
        endTime: this.rpClient.helpers.now(),
        // eslint-disable-next-line no-underscore-dangle
        retry: test._retries > 0,
      });
      this.currentTest = null;
    }
  }

  finishHook(hook, status) {
    const hookId = this.hookIds.get(hook);
    if (hookId) {
      this.hookIds.delete(hook);
      this.rpClient.finishTestItem(hookId, {
        status: status || hook.state,
        endTime: this.rpClient.helpers.now(),
      });
    }
  }
}

module.exports = RPReporter;
