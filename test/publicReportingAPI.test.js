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

const ClientPublicReportingAPI = require('@reportportal/client-javascript/lib/publicReportingAPI');
const PublicReportingAPI = require('./../lib/publicReportingAPI');

const publicReportingAPILaunchStatusMethods = [
  { method: 'setLaunchStatusPassed', status: 'passed' },
  { method: 'setLaunchStatusFailed', status: 'failed' },
  { method: 'setLaunchStatusSkipped', status: 'skipped' },
  { method: 'setLaunchStatusStopped', status: 'stopped' },
  { method: 'setLaunchStatusInterrupted', status: 'interrupted' },
  { method: 'setLaunchStatusCancelled', status: 'cancelled' },
  { method: 'setLaunchStatusInfo', status: 'info' },
  { method: 'setLaunchStatusWarn', status: 'warn' },
];
const publicReportingAPIStatusMethods = [
  { method: 'setStatusPassed', status: 'passed' },
  { method: 'setStatusFailed', status: 'failed' },
  { method: 'setStatusSkipped', status: 'skipped' },
  { method: 'setStatusStopped', status: 'stopped' },
  { method: 'setStatusInterrupted', status: 'interrupted' },
  { method: 'setStatusCancelled', status: 'cancelled' },
  { method: 'setStatusInfo', status: 'info' },
  { method: 'setStatusWarn', status: 'warn' },
];

describe('PublicReportingAPI', function() {
  describe('Log reporting', function() {
    let file;
    beforeAll(function() {
      file = {
        name: 'filename',
        type: 'image/png',
        content: Buffer.from([1, 2, 3, 4, 5, 6, 7]).toString('base64'),
      };
    });

    it('log: should call addLog method with specified level and message', function() {
      const spyAddLog = jest.spyOn(ClientPublicReportingAPI, 'addLog').mockImplementation(() => {});

      const expectedAddLogObj = {
        level: 'ERROR',
        message: 'message text',
      };

      PublicReportingAPI.log('ERROR', 'message text');

      expect(spyAddLog).toHaveBeenCalledWith(expectedAddLogObj);
    });
    it('log: should call addLog method with specified level, message and attachment', function() {
      const spyAddLog = jest.spyOn(ClientPublicReportingAPI, 'addLog').mockImplementation(() => {});

      const expectedAddLogObj = {
        level: 'ERROR',
        message: 'message text',
        file,
      };

      PublicReportingAPI.log('ERROR', 'message text', file);

      expect(spyAddLog).toHaveBeenCalledWith(expectedAddLogObj);
    });
    it('trace: should call addLog method with TRACE level and specified parameters', function() {
      const spyAddLog = jest.spyOn(ClientPublicReportingAPI, 'addLog').mockImplementation(() => {});

      const expectedAddLogObj = {
        level: 'TRACE',
        message: 'message text',
        file,
      };

      PublicReportingAPI.trace('message text', file);

      expect(spyAddLog).toHaveBeenCalledWith(expectedAddLogObj);
    });
    it('debug: should call addLog method with DEBUG level and specified parameters', function() {
      const spyAddLog = jest.spyOn(ClientPublicReportingAPI, 'addLog').mockImplementation(() => {});

      const expectedAddLogObj = {
        level: 'DEBUG',
        message: 'message text',
        file,
      };

      PublicReportingAPI.debug('message text', file);

      expect(spyAddLog).toHaveBeenCalledWith(expectedAddLogObj);
    });
    it('info: should call addLog method with INFO level and specified parameters', function() {
      const spyAddLog = jest.spyOn(ClientPublicReportingAPI, 'addLog').mockImplementation(() => {});

      const expectedAddLogObj = {
        level: 'INFO',
        message: 'message text',
        file,
      };

      PublicReportingAPI.info('message text', file);

      expect(spyAddLog).toHaveBeenCalledWith(expectedAddLogObj);
    });
    it('warn: should call addLog method with WARN level and specified parameters', function() {
      const spyAddLog = jest.spyOn(ClientPublicReportingAPI, 'addLog').mockImplementation(() => {});

      const expectedAddLogObj = {
        level: 'WARN',
        message: 'message text',
        file,
      };

      PublicReportingAPI.warn('message text', file);

      expect(spyAddLog).toHaveBeenCalledWith(expectedAddLogObj);
    });
    it('error: should call addLog method with ERROR level and specified parameters', function() {
      const spyAddLog = jest.spyOn(ClientPublicReportingAPI, 'addLog').mockImplementation(() => {});

      const expectedAddLogObj = {
        level: 'ERROR',
        message: 'message text',
        file,
      };

      PublicReportingAPI.error('message text', file);

      expect(spyAddLog).toHaveBeenCalledWith(expectedAddLogObj);
    });
    it('fatal: should call addLog method with FATAL level and specified parameters', function() {
      const spyAddLog = jest.spyOn(ClientPublicReportingAPI, 'addLog').mockImplementation(() => {});

      const expectedAddLogObj = {
        level: 'FATAL',
        message: 'message text',
        file,
      };

      PublicReportingAPI.fatal('message text', file);

      expect(spyAddLog).toHaveBeenCalledWith(expectedAddLogObj);
    });
    it('launchLog: should call addLaunchLog method with parameters', function() {
      const spyAddLog = jest
        .spyOn(ClientPublicReportingAPI, 'addLaunchLog')
        .mockImplementation(() => {});

      const expectedAddLogObj = {
        log: {
          level: 'ERROR',
          message: 'message text',
          file,
        },
      };

      PublicReportingAPI.launchLog('ERROR', 'message text', file);

      expect(spyAddLog).toHaveBeenCalledWith(expectedAddLogObj);
    });
    it('launchTrace: should call addLaunchLog with TRACE level and specified parameters', function() {
      const spyAddLog = jest
        .spyOn(ClientPublicReportingAPI, 'addLaunchLog')
        .mockImplementation(() => {});

      const expectedAddLogObj = {
        log: {
          level: 'TRACE',
          message: 'message text',
          file,
        },
      };

      PublicReportingAPI.launchTrace('message text', file);

      expect(spyAddLog).toHaveBeenCalledWith(expectedAddLogObj);
    });
    it('launchDebug: should call addLaunchLog with DEBUG level and specified parameters', function() {
      const spyAddLog = jest
        .spyOn(ClientPublicReportingAPI, 'addLaunchLog')
        .mockImplementation(() => {});

      const expectedAddLogObj = {
        log: {
          level: 'DEBUG',
          message: 'message text',
          file,
        },
      };

      PublicReportingAPI.launchDebug('message text', file);

      expect(spyAddLog).toHaveBeenCalledWith(expectedAddLogObj);
    });
    it('launchInfo: should call addLaunchLog with INFO level and specified parameters', function() {
      const spyAddLog = jest
        .spyOn(ClientPublicReportingAPI, 'addLaunchLog')
        .mockImplementation(() => {});

      const expectedAddLogObj = {
        log: {
          level: 'INFO',
          message: 'message text',
          file,
        },
      };

      PublicReportingAPI.launchInfo('message text', file);

      expect(spyAddLog).toHaveBeenCalledWith(expectedAddLogObj);
    });
    it('launchWarn: should call addLaunchLog with WARN level and specified parameters', function() {
      const spyAddLog = jest
        .spyOn(ClientPublicReportingAPI, 'addLaunchLog')
        .mockImplementation(() => {});

      const expectedAddLogObj = {
        log: {
          level: 'WARN',
          message: 'message text',
          file,
        },
      };

      PublicReportingAPI.launchWarn('message text', file);

      expect(spyAddLog).toHaveBeenCalledWith(expectedAddLogObj);
    });
    it('launchError: should call addLaunchLog with ERROR level and specified parameters', function() {
      const spyAddLog = jest
        .spyOn(ClientPublicReportingAPI, 'addLaunchLog')
        .mockImplementation(() => {});

      const expectedAddLogObj = {
        log: {
          level: 'ERROR',
          message: 'message text',
          file,
        },
      };

      PublicReportingAPI.launchError('message text', file);

      expect(spyAddLog).toHaveBeenCalledWith(expectedAddLogObj);
    });
    it('launchFatal: should call addLaunchLog with FATAL level and specified parameters', function() {
      const spyAddLog = jest
        .spyOn(ClientPublicReportingAPI, 'addLaunchLog')
        .mockImplementation(() => {});

      const expectedAddLogObj = {
        log: {
          level: 'FATAL',
          message: 'message text',
          file,
        },
      };

      PublicReportingAPI.launchFatal('message text', file);

      expect(spyAddLog).toHaveBeenCalledWith(expectedAddLogObj);
    });
  });

  describe('Item status reporting', function() {
    publicReportingAPIStatusMethods.forEach(({ method, status }) => {
      it(`${method}: should call ${method} method with "${status}" status`, function() {
        const spySetStatus = jest
          .spyOn(ClientPublicReportingAPI, 'setStatus')
          .mockImplementation(() => {});

        PublicReportingAPI[method]();

        expect(spySetStatus).toHaveBeenCalledWith(status);
      });
    });
  });

  describe('Launch status reporting', function() {
    publicReportingAPILaunchStatusMethods.forEach(({ method, status }) => {
      it(`${method}: should call ${method} method with "${status}" status`, function() {
        const spySetStatus = jest
          .spyOn(ClientPublicReportingAPI, 'setLaunchStatus')
          .mockImplementation(() => {});

        PublicReportingAPI[method]();

        expect(spySetStatus).toHaveBeenCalledWith(status);
      });
    });
  });
});
