const EventEmitter = require('events');
const { getDefaultConfig, RPClient } = require('./mocks');
const ReportportalAgent = require('./../lib/mochaReporter');

describe('test case id reporting', function() {
  let reporter;
  beforeAll(function() {
    const options = getDefaultConfig();
    const runner = new EventEmitter();
    reporter = new ReportportalAgent(runner, options);
    reporter.rpClient = new RPClient(options);
    reporter.suitesStackTempId = ['tempRootSuiteId', 'tempSuiteId'];
  });

  afterEach(function() {
    reporter.currentTest = null;
    reporter.testCaseIds.clear();
    jest.clearAllMocks();
  });

  it('onSetTestCaseId: should set test case id for current test in the testCaseIds map', function() {
    const currentTest = {
      title: 'test',
      tempId: 'testItemId',
    };
    reporter.currentTest = currentTest;
    const testCaseId = 'test_case_id';
    const expectedDescriptionsMap = new Map([['testItemId', testCaseId]]);

    reporter.onSetTestCaseId({ testCaseId });

    expect(reporter.testCaseIds).toEqual(expectedDescriptionsMap);
  });

  it('onSetTestCaseId: should overwrite test case id for current test in the testCaseIds map', function() {
    const currentTest = {
      title: 'test',
      tempId: 'testItemId',
    };
    reporter.currentTest = currentTest;
    reporter.testCaseIds.set('testItemId', 'old_test_case_id');
    const newTestCaseId = 'new_test_case_id';

    const expectedDescriptionsMap = new Map([['testItemId', newTestCaseId]]);

    reporter.onSetTestCaseId({ testCaseId: newTestCaseId });

    expect(reporter.testCaseIds).toEqual(expectedDescriptionsMap);
  });

  it('onSetTestCaseId: should set test case id for current suite in testCaseIds map', function() {
    const testCaseId = 'suite_test_case_id';
    const expectedDescriptionsMap = new Map([['tempSuiteId', testCaseId]]);

    reporter.onSetTestCaseId({ testCaseId });

    expect(reporter.testCaseIds).toEqual(expectedDescriptionsMap);
  });
});
