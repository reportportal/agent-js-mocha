const EventEmitter = require('events');
const { getDefaultConfig, RPClient, mockedDate } = require('./mocks');
const RPReporter = require('./../lib/mochaReporter');

describe('test items reporting', function() {
  let reporter;
  let suite;

  beforeAll(function() {
    const options = getDefaultConfig();
    const runner = new EventEmitter();
    reporter = new RPReporter(runner, options);
    reporter.rpClient = new RPClient(options);
    reporter.launchId = 'tempLaunchId';
    suite = {
      title: 'Suite',
      parent: {},
    };
    reporter.suiteIds.set(suite, 'tempSuiteId');
  });

  afterEach(function() {
    reporter.currentTest = null;
    reporter.hookIds.clear();
    jest.clearAllMocks();
  });

  describe('onTestStart', () => {
    it('should start test', function(){
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

      expect(spyStartTestItem).toHaveBeenCalledWith(expectedTestStartObj, 'tempLaunchId', 'tempSuiteId');
    });

    it('should start first retry', function(){
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

      expect(spyStartTestItem).toHaveBeenCalledWith(expectedTestStartObj, 'tempLaunchId', 'tempSuiteId');
    });

    it('should finish first and start second retry', function(){
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
      expect(spyStartTestItem).toHaveBeenCalledWith(expectedTestStartObj, 'tempLaunchId', 'tempSuiteId');
      expect(spyFinishTestItem).toHaveBeenCalledWith('testItemId', expectedTestFinishObj);
    });
  });

  describe('onTestPending', () => {
    it('should start and finish pending test', function(){
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
      };
      const expectedTestFinishObj = {
        endTime: mockedDate,
        status: 'skipped',
      };

      reporter.onTestPending(testItem);

      expect(spyStartTestItem).toHaveBeenCalledWith(expectedTestStartObj, 'tempLaunchId', 'tempSuiteId');
      expect(spyFinishTestItem).toHaveBeenCalledWith('testItemId', expectedTestFinishObj);
    });
  });

  describe('onTestFinish', () => {
    it('should finish passed test', function(){
      const spyFinishTestItem = jest.spyOn(reporter.rpClient, 'finishTestItem');
      const currentTest = {
        title: 'test',
        parent: suite,
        state: 'passed',
        tempId: 'testItemId'
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

    it('should finish failed test', function(){
      const spyFinishTestItem = jest.spyOn(reporter.rpClient, 'finishTestItem');
      const currentTest = {
        title: 'test',
        parent: suite,
        state: 'failed',
        tempId: 'testItemId'
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

    it('should finish failed retry', function(){
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

  describe('onTestFail', () => {
    it('should send log on test fail', function(){
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

    it('should finish current test as skipped on hook fail', function(){
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
          currentTest: currentTest,
        }
      };
      const expectedTestFinishObj = {
        endTime: mockedDate,
        status: 'skipped',
        retry: false,
      };
      reporter.hookIds.set(hook, 'hookId');
      hook.state = 'failed';

      reporter.onTestFail(hook, 'error message');

      expect(spyFinishTestItem).toHaveBeenCalledTimes(2);
      expect(spyFinishTestItem).toHaveBeenNthCalledWith(2, 'testItemId', expectedTestFinishObj);
    });
  });
});


