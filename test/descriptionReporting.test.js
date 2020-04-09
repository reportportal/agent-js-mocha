const EventEmitter = require('events');
const { getDefaultConfig, RPClient, mockedDate } = require('./mocks');
const ReportportalAgent = require('./../lib/mochaReporter');

describe('description reporting', function() {
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
    reporter.descriptions.clear();
    jest.clearAllMocks();
  });

  it('onSetDescription: should set description for current test in the descriptions map', function() {
    const currentTest = {
      title: 'test',
      tempId: 'testItemId',
    };
    reporter.currentTest = currentTest;
    const description = 'test description';
    const expectedDescriptionsMap = new Map([['testItemId', description]]);

    reporter.onSetDescription({ text: description });

    expect(reporter.descriptions).toEqual(expectedDescriptionsMap);
  });

  it('onSetDescription: should overwrite description for current test in the descriptions map', function() {
    const currentTest = {
      title: 'test',
      tempId: 'testItemId',
    };
    reporter.currentTest = currentTest;
    reporter.descriptions.set('testItemId', 'old description');
    const newDescription = 'new description';

    const expectedDescriptionsMap = new Map([['testItemId', newDescription]]);

    reporter.onSetDescription({ text: newDescription });

    expect(reporter.descriptions).toEqual(expectedDescriptionsMap);
  });

  it('onSetDescription: should set description for current suite in descriptions map', function() {
    const description = 'test description';
    const expectedDescriptionsMap = new Map([['tempSuiteId', description]]);

    reporter.onSetDescription({ text: description });

    expect(reporter.descriptions).toEqual(expectedDescriptionsMap);
  });
});
