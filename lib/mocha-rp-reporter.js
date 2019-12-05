const RPClient = require("reportportal-client");
const itemTypes = require("./helpers/itemTypes");
const logLevels = require("./helpers/logLevels");
const testStatuses = require("./helpers/testStatuses");

class RPReporter {

    constructor(runner, options) {
        this.rpClient = new RPClient(options.reporterOptions);
        this.suiteIds = new Map();
        this.testIds = new Map();

        runner.on("start", async () => {
            try {
                const launchObj = this.rpClient.startLaunch({
                    name: options.reporterOptions.launch,
                    start_time: this.rpClient.helpers.now(),
                    description: options.reporterOptions.launch,
                    tags: options.reporterOptions.tags || []
                });
                this.launchId = launchObj.tempId;
                await launchObj.promise;
            } catch (err) {
                console.log(`Failed to launch run. Error: ${err}`);
            }
        });

        runner.on("end", async () => {
            try {
                await this.rpClient.finishLaunch(this.launchId, {
                    end_time: this.rpClient.helpers.now()
                });
            } catch (err) {
                console.log(`Failed to finish run. Error: ${err}`);
            }
        });

        runner.on("suite", async (suite) => {
            try {
                if (!suite.root) {
                    if (this.suiteIds.has(suite.parent)) {
                        let parentId = this.suiteIds.get(suite.parent);
                        const suiteObj = this.rpClient.startTestItem({
                            description: suite.title,
                            name: suite.title,
                            start_time: this.rpClient.helpers.now(),
                            tags: options.reporterOptions.tags || [],
                            type: itemTypes.SUITE
                        }, this.launchId, parentId);
                        if (!this.suiteIds.has(suite)) {
                            this.suiteIds.set(suite, suiteObj.tempId);
                        }
                        await suiteObj.promise
                    }
                } else {
                    this.suiteIds.set(suite, undefined);
                }
            } catch (err) {
                console.log(`Failed to create child item. Error: ${err}`);
            }
        });

        runner.on("suite end", async (suite) => {
            try {
                const suiteId = this.suiteIds.get(suite);
                if (suiteId) {
                    await this.rpClient.finishTestItem(suiteId, {
                        end_time: this.rpClient.helpers.now()
                    });
                }
            } catch (err) {
                console.log(`Failed to finish child item. Error: ${err}`);
            }
        });

        runner.on("test", async (test) => {
            try {
                const parentId = this.suiteIds.get(test.parent);
                const testObj = this.rpClient.startTestItem({
                    description: test.title,
                    name: test.title,
                    start_time: this.rpClient.helpers.now(),
                    tags: options.reporterOptions.tags || [],
                    type: itemTypes.TEST
                }, this.launchId, parentId);
                this.testIds.set(test, testObj.tempId);
                await testObj.promise;
            } catch (err) {
                console.log(`Failed to create child item. Error: ${err}`);
            }
        });

        runner.on("fail", async (test, err) => {
            try {
                const testId = this.testIds.get(test);
                await this.rpClient.sendLog(testId, {
                    level: logLevels.ERROR,
                    message: err.message
                });
            } catch (err) {
                console.log(`Failed to send log for item. Error: ${err}`);
            }
        });

        runner.on("pending", async (test) => {
            try {
                const parentId = this.suiteIds.get(test.parent);
                const testObj = this.rpClient.startTestItem({
                    description: test.title,
                    name: test.title,
                    start_time: this.rpClient.helpers.now(),
                    tags: options.reporterOptions.tags || [],
                    type: itemTypes.TEST
                }, this.launchId, parentId);
                await testObj.promise;

                await this.rpClient.finishTestItem(testObj.tempId, {
                    status: testStatuses.SKIPPED,
                    end_time: this.rpClient.helpers.now()
                });
            } catch (err) {
                console.log(`Failed to create child item. Error: ${err}`);
            }
        });

        runner.on("test end", async (test) => {
            try {
                const testId = this.testIds.get(test);
                if (testId) {
                    await this.rpClient.finishTestItem(testId, {
                        status: test.state,
                        end_time: this.rpClient.helpers.now()
                    });
                }
            } catch (err) {
                console.log(`Failed to finish child item. Error: ${err}`);
            }
        });

    }
}

module.exports = RPReporter;
