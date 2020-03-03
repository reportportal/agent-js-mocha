const EventEmitter = require('events');
const { getDefaultConfig } = require('./mocks');
const RPReporter = require('./../lib/mochaReporter');

describe('constructor', function() {
  test('should create RP client instance with passed options', function() {
    const options = getDefaultConfig();
    const runner = new EventEmitter();
    const reporter = new RPReporter(runner, options);
    expect(reporter.rpClient).toBeDefined();
    expect(reporter.options).toEqual(options);
  });

  test('should override default options', function() {
    const options = getDefaultConfig();
    options.reporterOptions.launch = 'NewLaunchName';
    options.reporterOptions.rerun = true;
    const runner = new EventEmitter();
    const reporter = new RPReporter(runner, options);
    expect(reporter.options.reporterOptions.launch).toEqual('NewLaunchName');
    expect(reporter.options.reporterOptions.rerun).toEqual(true);
  });
});
