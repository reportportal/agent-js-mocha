/*
 *  Copyright 2020 EPAM Systems
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

const EventEmitter = require('events');
const { getDefaultConfig, RPClient, mockedDate } = require('./mocks');
const ReportportalAgent = require('./../lib/mochaReporter');

jest.mock('./../lib/utils', () => ({
  getAgentInfo: () => ({
    name: 'agentName',
    version: 'agentVersion',
  }),
  parseAttributes: () => [{ key: 'key', value: 'value' }],
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
          {
            key: 'key',
            value: 'value',
          },
        ],
        mode: undefined,
        rerun: undefined,
        rerunOf: undefined,
      };
      const spyStartLaunch = jest.spyOn(reporter.rpClient, 'startLaunch');

      reporter.onLaunchStart();

      expect(reporter.launchId).toEqual('tempLaunchId');
      expect(spyStartLaunch).toHaveBeenCalledWith(expetedLaunchStartObject);
    });

    it('should submit results to Debug tab', function() {
      const options = getDefaultConfig();
      options.reporterOptions.mode = 'DEBUG';
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
          {
            key: 'key',
            value: 'value',
          },
        ],
        mode: 'DEBUG',
      };

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
          {
            key: 'key',
            value: 'value',
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

    it('setLaunchStatus: should finish launch with specifyed status', function() {
      const options = getDefaultConfig();
      const runner = new EventEmitter();
      const reporter = new ReportportalAgent(runner, options);
      reporter.rpClient = new RPClient(options);
      const spyFinishLaunch = jest.spyOn(reporter.rpClient, 'finishLaunch');
      reporter.launchId = 'tempLaunchId';
      reporter.setLaunchStatus('info');

      reporter.onLaunchFinish();

      expect(spyFinishLaunch).toHaveBeenCalledWith('tempLaunchId', {
        endTime: mockedDate,
        status: 'info',
      });
    });
  });

  describe('getSystemAttributes', function() {
    it('skippedIssue undefined. Should return attribute with agent name and version', function() {
      const options = getDefaultConfig();
      const runner = new EventEmitter();
      const reporter = new ReportportalAgent(runner, options);
      reporter.rpClient = new RPClient(options);
      const expectedSystemAttributes = [
        {
          key: 'agent',
          value: 'agentName|agentVersion',
          system: true,
        },
      ];

      const systemAttributes = reporter.getSystemAttributes();

      expect(systemAttributes).toEqual(expectedSystemAttributes);
    });

    it('skippedIssue = true. Should return attribute with agent name and version', function() {
      const options = getDefaultConfig();
      options.reporterOptions.skippedIssue = true;
      const runner = new EventEmitter();
      const reporter = new ReportportalAgent(runner, options);
      reporter.rpClient = new RPClient(options);
      const expectedSystemAttributes = [
        {
          key: 'agent',
          value: 'agentName|agentVersion',
          system: true,
        },
      ];

      const systemAttributes = reporter.getSystemAttributes();

      expect(systemAttributes).toEqual(expectedSystemAttributes);
    });

    it('skippedIssue = false. Should return 2 attribute: with agent name/version and skippedIssue', function() {
      const options = getDefaultConfig();
      options.reporterOptions.skippedIssue = false;
      const runner = new EventEmitter();
      const reporter = new ReportportalAgent(runner, options);
      reporter.rpClient = new RPClient(options);
      const expectedSystemAttributes = [
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

      expect(systemAttributes).toEqual(expectedSystemAttributes);
    });
  });
});
