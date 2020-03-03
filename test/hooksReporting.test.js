const EventEmitter = require('events');
const { getDefaultConfig, RPClient, mockedDate } = require('./mocks');
const RPReporter = require('./../lib/mochaReporter');

describe('reporting hooks', function() {
  let reporter;
  let suiteFirstLevel;
  beforeAll(function() {
    const options = getDefaultConfig();
    const runner = new EventEmitter();
    reporter = new RPReporter(runner, options);
    reporter.rpClient = new RPClient(options);
    reporter.launchId = 'tempLaunchId';
    const rootSuite = {
      title: '',
      root: true,
    };
    suiteFirstLevel = {
      title: 'Suite',
      parent: rootSuite,
    };
    reporter.suiteIds.set(rootSuite, undefined);
    reporter.suiteIds.set(suiteFirstLevel, 'tempSuiteId');
  });

  afterEach(function () {
    reporter.hookIds.clear();
    reporter.currentTest = null;
    jest.clearAllMocks();
  });

  it('should start before each hook', function(){
    const spyStartTestItem = jest.spyOn(reporter.rpClient, 'startTestItem');
    const hook = {
      title: '"before each" hook: before each hook with title',
      parent: suiteFirstLevel,
    };
    reporter.onHookStart(hook);
    const expectedHookStartObj = {
      name: 'before each hook with title',
      startTime: mockedDate,
      type: 'BEFORE_METHOD',
    };
    expect(spyStartTestItem).toHaveBeenCalledWith(expectedHookStartObj, 'tempLaunchId', 'tempSuiteId');
  });

  it('should start before all hook', function(){
    const spyStartTestItem = jest.spyOn(reporter.rpClient, 'startTestItem');
    const hook = {
      title: '"before all" hook: before all hook with title',
      parent: suiteFirstLevel,
    };
    reporter.onHookStart(hook);
    const expectedHookStartObj = {
      name: 'before all hook with title',
      startTime: mockedDate,
      type: 'BEFORE_SUITE',
    };
    expect(spyStartTestItem).toHaveBeenCalledWith(expectedHookStartObj, 'tempLaunchId', undefined);
  });

  it('should start after each hook', function(){
    const spyStartTestItem = jest.spyOn(reporter.rpClient, 'startTestItem');
    const hook = {
      title: '"after each" hook: after each hook with title',
      parent: suiteFirstLevel,
    };
    reporter.onHookStart(hook);
    const expectedHookStartObj = {
      name: 'after each hook with title',
      startTime: mockedDate,
      type: 'AFTER_METHOD',
    };
    expect(spyStartTestItem).toHaveBeenCalledWith(expectedHookStartObj, 'tempLaunchId', 'tempSuiteId');
  });

  it('should start after all hook', function(){
    const spyStartTestItem = jest.spyOn(reporter.rpClient, 'startTestItem');
    const hook = {
      title: '"after all" hook: after all hook with title',
      parent: suiteFirstLevel,
    };
    reporter.onHookStart(hook);
    const expectedHookStartObj = {
      name: 'after all hook with title',
      startTime: mockedDate,
      type: 'AFTER_SUITE',
    };
    expect(spyStartTestItem).toHaveBeenCalledWith(expectedHookStartObj, 'tempLaunchId', undefined);
  });

  it('should finish passed hook', function(){
    const hook = {
      title: '"before each" hook: before each hook with title',
      parent: suiteFirstLevel,
    };
    reporter.hookIds.set(hook, 'hookTempId');
    hook.state = 'passed';
    const expectedHookFinishObj = {
      status: 'passed',
      endTime: mockedDate,
    };
    reporter.onHookFinish(hook);
    expect(reporter.rpClient.finishTestItem).toHaveBeenCalledWith('hookTempId', expectedHookFinishObj);
  });

  it('should finish failed hook', function(){
    const spyFinishTestItem = jest.spyOn(reporter.rpClient, 'finishTestItem');
    const spySendLog = jest.spyOn(reporter.rpClient, 'sendLog');
    const currentTest = {
      title: 'test #1',
      parent: suiteFirstLevel,
      state: 'pending',
      tempId: 'tempTestId',
    };
    reporter.currentTest = currentTest;
    const hook = {
      title: '"before each" hook: named hook',
      parent: suiteFirstLevel,
      state: 'failed',
      type: 'hook',
      ctx: {
        currentTest: currentTest,
      }
    };
    reporter.hookIds.set(hook, 'tempHookId');
    hook.state = 'failed';
    const expectedHookFinishObj = {
      status: 'failed',
      endTime: mockedDate,
    };
    reporter.onTestFail(hook, 'error message');
    const expectedLogObj = {
      level: 'ERROR',
      message: 'error message',
    };
    expect(spySendLog).toHaveBeenCalledWith('tempTestId', expectedLogObj);
    expect(spyFinishTestItem).toHaveBeenCalledWith('tempHookId', expectedHookFinishObj);
  });
});
