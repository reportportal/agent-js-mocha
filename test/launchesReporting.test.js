const EventEmitter = require('events');
const { getDefaultConfig, RPClient, mockedDate } = require('./mocks');
const RPReporter = require('./../lib/mochaReporter');
describe('launch reporting', function() {
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('should start launch with default options', function() {
    const options = getDefaultConfig();
    const runner = new EventEmitter();
    const reporter = new RPReporter(runner, options);
    reporter.rpClient = new RPClient(options);
    reporter.onLaunchStart();
    const spyStartLaunch = jest.spyOn(reporter.rpClient, 'startLaunch');
    expect(reporter.launchId).toEqual('tempLaunchId');
    const expetedLaunchStartObject = {
      token: '00000000-0000-0000-0000-000000000000',
      name: 'LauncherName',
      startTime: mockedDate,
      description: 'Launch description',
      attributes: [],
      rerun: undefined,
      rerunOf: undefined,
    };
    expect(spyStartLaunch).toHaveBeenCalledWith(expetedLaunchStartObject);
  });

  it('should rerun launch', function() {
    const options = getDefaultConfig();
    options.reporterOptions.rerun = true;
    options.reporterOptions.rerunOf = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
    const runner = new EventEmitter();
    const reporter = new RPReporter(runner, options);
    reporter.rpClient = new RPClient(options);
    const spyStartLaunch = jest.spyOn(reporter.rpClient, 'startLaunch');
    reporter.onLaunchStart();
    expect(reporter.launchId).toEqual('tempLaunchId');
    const expetedLaunchStartObject = {
      token: '00000000-0000-0000-0000-000000000000',
      name: 'LauncherName',
      startTime: mockedDate,
      description: 'Launch description',
      attributes: [],
      rerun: true,
      rerunOf: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    };
    expect(spyStartLaunch).toHaveBeenCalledWith(expetedLaunchStartObject);
  });

  it('should finish launch', function() {
    const options = getDefaultConfig();
    const runner = new EventEmitter();
    const reporter = new RPReporter(runner, options);
    reporter.rpClient = new RPClient(options);
    const spyFinishLaunch = jest.spyOn(reporter.rpClient, 'finishLaunch');
    reporter.launchId = 'tempLaunchId';
    reporter.onLaunchFinish();
    expect(spyFinishLaunch).toHaveBeenCalledWith('tempLaunchId', {
      endTime: mockedDate,
    });
  });
});

