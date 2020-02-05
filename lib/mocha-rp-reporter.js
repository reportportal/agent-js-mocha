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
    this.testIds = new Map();

    runner.on(EVENT_RUN_BEGIN, async () => {
      try {
        const launchObj = this.rpClient.startLaunch({
          token: options.reporterOptions.token,
          name: options.reporterOptions.launch,
          startTime: this.rpClient.helpers.now(),
          description: options.reporterOptions.description,
          attributes: options.attributes,
        });
        this.launchId = launchObj.tempId;
        await launchObj.promise;
      } catch (err) {
        console.log(`Failed to launch run. Error: ${err}`);
      }
    });

    runner.on(EVENT_RUN_END, async () => {
      try {
        await this.rpClient.finishLaunch(this.launchId, {
          endTime: this.rpClient.helpers.now(),
        });
      } catch (err) {
        console.log(`Failed to finish run. Error: ${err}`);
      }
    });

    runner.on(EVENT_SUITE_BEGIN, async (suite) => {
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
            await suiteObj.promise;
          }
        } else {
          this.suiteIds.set(suite, undefined);
        }
      } catch (err) {
        console.log(`Failed to create child item. Error: ${err}`);
      }
    });

    runner.on(EVENT_SUITE_END, async (suite) => {
      try {
        const suiteId = this.suiteIds.get(suite);
        if (suiteId) {
          await this.rpClient.finishTestItem(suiteId, {
            endTime: this.rpClient.helpers.now(),
          });
        }
      } catch (err) {
        console.log(`Failed to finish child item. Error: ${err}`);
      }
    });

    runner.on(EVENT_TEST_BEGIN, async (test) => {
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
        this.testIds.set(test, testObj.tempId);
        await testObj.promise;
      } catch (err) {
        console.log(`Failed to create child item. Error: ${err}`);
      }
    });

    runner.on(EVENT_TEST_FAIL, async (test, err) => {
      try {
        const testId = this.testIds.get(test);
        await this.rpClient.sendLog(testId, {
          level: logLevels.ERROR,
          message: err.message || err.toString(),
        });
        if (test.type === 'hook') {
          this.finishTest(test);
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

        await this.rpClient.finishTestItem(testObj.tempId, {
          status: testStatuses.SKIPPED,
          endTime: this.rpClient.helpers.now(),
        });
      } catch (err) {
        console.log(`Failed to create child item. Error: ${err}`);
      }
    });

    runner.on(EVENT_TEST_END, async (test) => {
      try {
        this.finishTest(test);
      } catch (err) {
        console.log(`Failed to finish child item. Error: ${err}`);
      }
    });

    runner.on(EVENT_HOOK_BEGIN, async (hook) => {
      try {
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
        this.testIds.set(hook, tempId);
        await promise;
      } catch (err) {
        console.error(`Failed to create hook. Error: ${err}`);
      }
    });

    runner.on(EVENT_HOOK_END, async (hook) => {
      try {
        this.finishTest(hook, testStatuses.PASSED);
      } catch (err) {
        console.error(`Failed to finish hook. Error: ${err}`);
      }
    });
  }

  async finishTest(test, status) {
    const testId = this.testIds.get(test);
    if (testId) {
      this.testIds.delete(test);
      await this.rpClient.finishTestItem(testId, {
        status: status || test.state,
        endTime: this.rpClient.helpers.now(),
      });
    }
  }
}

module.exports = RPReporter;
