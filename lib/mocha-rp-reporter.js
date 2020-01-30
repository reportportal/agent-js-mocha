const RPClient = require('reportportal-client');
const itemTypes = require('./helpers/itemTypes');
const logLevels = require('./helpers/logLevels');
const testStatuses = require('./helpers/testStatuses');

class RPReporter {
  constructor(runner, options) {
    this.rpClient = new RPClient(options.reporterOptions);
    this.suiteIds = new Map();
    this.testIds = new Map();

    runner.on('start', async () => {
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

    runner.on('end', async () => {
      try {
        await this.rpClient.finishLaunch(this.launchId, {
          endTime: this.rpClient.helpers.now(),
        });
      } catch (err) {
        console.log(`Failed to finish run. Error: ${err}`);
      }
    });

    runner.on('suite', async (suite) => {
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
                type: itemTypes.SUITE,
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

    runner.on('suite end', async (suite) => {
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

    runner.on('test', async (test) => {
      try {
        const parentId = this.suiteIds.get(test.parent);
        const testObj = this.rpClient.startTestItem(
          {
            description: test.title,
            name: test.title,
            startTime: this.rpClient.helpers.now(),
            attributes: [],
            type: itemTypes.STEP,
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

    runner.on('fail', async (test, err) => {
      try {
        const testId = this.testIds.get(test);
        await this.rpClient.sendLog(testId, {
          level: logLevels.ERROR,
          message: err.message,
        });
      } catch (error) {
        console.log(`Failed to send log for item. Error: ${error}`);
      }
    });

    runner.on('pending', async (test) => {
      try {
        const parentId = this.suiteIds.get(test.parent);
        const testObj = this.rpClient.startTestItem(
          {
            description: test.title,
            name: test.title,
            startTime: this.rpClient.helpers.now(),
            attributes: [],
            type: itemTypes.STEP,
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

    runner.on('test end', async (test) => {
      try {
        const testId = this.testIds.get(test);
        if (testId) {
          await this.rpClient.finishTestItem(testId, {
            status: test.state,
            endTime: this.rpClient.helpers.now(),
          });
        }
      } catch (err) {
        console.log(`Failed to finish child item. Error: ${err}`);
      }
    });
  }
}

module.exports = RPReporter;
