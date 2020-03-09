const EventEmitter = require('events');
const { getDefaultConfig, RPClient, mockedDate } = require('./mocks');
const RPReporter = require('./../lib/mochaReporter');
describe('launch reporting', function() {
  afterEach(() => {
    jest.clearAllMocks();
  });
  describe('onLaunchStart', ()=>{
    it('should start launch with default options', function() {
      const options = getDefaultConfig();
      const runner = new EventEmitter();
      const reporter = new RPReporter(runner, options);
      reporter.rpClient = new RPClient(options);
      const expetedLaunchStartObject = {
        token: '00000000-0000-0000-0000-000000000000',
        name: 'LauncherName',
        startTime: mockedDate,
        description: 'Launch description',
        attributes: [],
        rerun: undefined,
        rerunOf: undefined,
      };
      const spyStartLaunch = jest.spyOn(reporter.rpClient, 'startLaunch');

      reporter.onLaunchStart();

      expect(reporter.launchId).toEqual('tempLaunchId');
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
      const expetedLaunchStartObject = {
        token: '00000000-0000-0000-0000-000000000000',
        name: 'LauncherName',
        startTime: mockedDate,
        description: 'Launch description',
        attributes: [],
        rerun: true,
        rerunOf: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
      };

      reporter.onLaunchStart();

      expect(reporter.launchId).toEqual('tempLaunchId');
      expect(spyStartLaunch).toHaveBeenCalledWith(expetedLaunchStartObject);
    });
  });

  describe('onLaunchFinish', () => {
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
});

