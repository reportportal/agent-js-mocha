const EventEmitter = require('events');
const { getDefaultConfig, RPClient, mockedDate } = require('./mocks');
const ReportportalAgent = require('./../lib/mochaReporter');

jest.mock('./../lib/utils', () => ({
  getAgentInfo: () => ({
    name: 'agentName',
    version: 'agentVersion',
  }),
}));

describe('launch reporting', function() {
  afterEach(function() {
    jest.clearAllMocks();
  });
  describe('onLaunchStart', function() {
    it('should start launch with default options', function() {
      const options = getDefaultConfig();
      const runner = new EventEmitter();
      const reporter = new ReportportalAgent(runner, options);
      reporter.rpClient = new RPClient(options);
      const expetedLaunchStartObject = {
        token: '00000000-0000-0000-0000-000000000000',
        name: 'LauncherName',
        startTime: mockedDate,
        description: 'Launch description',
        attributes: [
          {
            key: 'agent',
            value: 'agentName|agentVersion',
            system: true,
          },
        ],
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
      const reporter = new ReportportalAgent(runner, options);
      reporter.rpClient = new RPClient(options);
      const spyStartLaunch = jest.spyOn(reporter.rpClient, 'startLaunch');
      const expetedLaunchStartObject = {
        token: '00000000-0000-0000-0000-000000000000',
        name: 'LauncherName',
        startTime: mockedDate,
        description: 'Launch description',
        attributes: [
          {
            key: 'agent',
            value: 'agentName|agentVersion',
            system: true,
          },
        ],
        rerun: true,
        rerunOf: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
      };

      reporter.onLaunchStart();

      expect(reporter.launchId).toEqual('tempLaunchId');
      expect(spyStartLaunch).toHaveBeenCalledWith(expetedLaunchStartObject);
    });
  });

  describe('onLaunchFinish', function() {
    it('should finish launch', function() {
      const options = getDefaultConfig();
      const runner = new EventEmitter();
      const reporter = new ReportportalAgent(runner, options);
      reporter.rpClient = new RPClient(options);
      const spyFinishLaunch = jest.spyOn(reporter.rpClient, 'finishLaunch');
      reporter.launchId = 'tempLaunchId';

      reporter.onLaunchFinish();

      expect(spyFinishLaunch).toHaveBeenCalledWith('tempLaunchId', {
        endTime: mockedDate,
      });
    });
  });

  describe('getSystemAttributes', function() {
    it('skippedIssue undefined. Should return attribute with agent name and version', function() {
      const options = getDefaultConfig();
      const runner = new EventEmitter();
      const reporter = new ReportportalAgent(runner, options);
      reporter.rpClient = new RPClient(options);
      const expetedSystemAttributes = [
        {
          key: 'agent',
          value: 'agentName|agentVersion',
          system: true,
        },
      ];

      const systemAttributes = reporter.getSystemAttributes();

      expect(systemAttributes).toEqual(expetedSystemAttributes);
    });

    it('skippedIssue = true. Should return attribute with agent name and version', function() {
      const options = getDefaultConfig();
      options.reporterOptions.skippedIssue = true;
      const runner = new EventEmitter();
      const reporter = new ReportportalAgent(runner, options);
      reporter.rpClient = new RPClient(options);
      const expetedSystemAttributes = [
        {
          key: 'agent',
          value: 'agentName|agentVersion',
          system: true,
        },
      ];

      const systemAttributes = reporter.getSystemAttributes();

      expect(systemAttributes).toEqual(expetedSystemAttributes);
    });

    it('skippedIssue = false. Should return 2 attribute: with agent name/version and skippedIssue', function() {
      const options = getDefaultConfig();
      options.reporterOptions.skippedIssue = false;
      const runner = new EventEmitter();
      const reporter = new ReportportalAgent(runner, options);
      reporter.rpClient = new RPClient(options);
      const expetedSystemAttributes = [
        {
          key: 'agent',
          value: 'agentName|agentVersion',
          system: true,
        },
        {
          key: 'skippedIssue',
          value: 'false',
          system: true,
        },
      ];

      const systemAttributes = reporter.getSystemAttributes();

      expect(systemAttributes).toEqual(expetedSystemAttributes);
    });
  });
});
