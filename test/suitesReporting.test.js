const EventEmitter = require('events');
const { getDefaultConfig, RPClient, mockedDate } = require('./mocks');
const RPReporter = require('./../lib/mochaReporter');

describe('suites reporting', function() {
  let reporter;
  let suiteFirstLevel;
  let suiteSecondLevel;
  let rootSuite;
  beforeAll(function() {
    const options = getDefaultConfig();
    const runner = new EventEmitter();
    reporter = new RPReporter(runner, options);
    reporter.rpClient = new RPClient(options);
    reporter.launchId = 'tempLaunchId';
    rootSuite = {
      title: '',
      root: true,
    };
    suiteFirstLevel = {
      title: 'First level suite',
      parent: rootSuite,
    };
    suiteSecondLevel = {
      title: 'Second level suite',
      parent: suiteFirstLevel,
    }
  });
  afterEach(() => {
    reporter.suiteIds.clear();
    jest.clearAllMocks();
  });
  it('shouldn\'t start root suite', function() {
    const spyStartTestItem = jest.spyOn(reporter.rpClient, 'startTestItem');
    reporter.onSuiteStart(rootSuite);
    expect(spyStartTestItem).not.toHaveBeenCalled();
  });

  it('should start first-level suite', function(){
    const spyStartTestItem = jest.spyOn(reporter.rpClient, 'startTestItem');
    reporter.suiteIds.set(rootSuite, undefined);
    reporter.onSuiteStart(suiteFirstLevel);
    const expectedSuiteStartObj = {
      name: 'First level suite',
      startTime: mockedDate,
      attributes: [],
      type: 'suite',
    };
    expect(spyStartTestItem).toHaveBeenCalledWith(expectedSuiteStartObj, 'tempLaunchId', undefined);
  });

  it('should start nested suite', function(){
    const spyStartTestItem = jest.spyOn(reporter.rpClient, 'startTestItem');
    reporter.suiteIds.set(rootSuite, undefined);
    reporter.suiteIds.set(suiteFirstLevel, 'firstLevelSuiteId');
    reporter.onSuiteStart(suiteSecondLevel);
    const expectedSuiteStartObj = {
      name: 'Second level suite',
      startTime: mockedDate,
      attributes: [],
      type: 'suite',
    };
    expect(spyStartTestItem).toHaveBeenCalledWith(expectedSuiteStartObj, 'tempLaunchId', 'firstLevelSuiteId');
  });
  it('should finish started suite', function() {
    const spyFinishTestItem = jest.spyOn(reporter.rpClient, 'finishTestItem');
    reporter.suiteIds.set(rootSuite, undefined);
    reporter.suiteIds.set(suiteFirstLevel, 'firstLevelSuiteId');
    reporter.onSuiteFinish(suiteFirstLevel);
    expect(spyFinishTestItem).toHaveBeenCalledWith('firstLevelSuiteId', { endTime: mockedDate });
  });
});
