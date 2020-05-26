const ClientPublicReportingAPI = require('reportportal-client/lib/publicReportingAPI');
const { RP_STATUSES } = require('reportportal-client/lib/constants/statuses');
const PublicReportingAPI = require('./../lib/publicReportingAPI');

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
    it('setStatus: should call setStatus method with "passed" status', function() {
      const spySetStatus = jest.spyOn(ClientPublicReportingAPI, 'setStatus').mockImplementation(() => {});

      PublicReportingAPI.setStatusPassed();

      expect(spySetStatus).toHaveBeenCalledWith(RP_STATUSES.PASSED);
    });

    it('setStatusFailed: should call setStatus method with "failed" status', function() {
      const spySetStatus = jest.spyOn(ClientPublicReportingAPI, 'setStatus').mockImplementation(() => {});

      PublicReportingAPI.setStatusFailed();

      expect(spySetStatus).toHaveBeenCalledWith(RP_STATUSES.FAILED);
    });

    it('setStatusSkipped: should call setStatus method with "skipped" status', function() {
      const spySetStatus = jest.spyOn(ClientPublicReportingAPI, 'setStatus').mockImplementation(() => {});

      PublicReportingAPI.setStatusSkipped();

      expect(spySetStatus).toHaveBeenCalledWith(RP_STATUSES.SKIPPED);
    });

    it('setStatusStopped: should call setStatus method with "stopped" status', function() {
      const spySetStatus = jest.spyOn(ClientPublicReportingAPI, 'setStatus').mockImplementation(() => {});

      PublicReportingAPI.setStatusStopped();

      expect(spySetStatus).toHaveBeenCalledWith(RP_STATUSES.STOPPED);
    });

    it('setStatusInterrupted: should call setStatus method with "interrupted" status', function() {
      const spySetStatus = jest.spyOn(ClientPublicReportingAPI, 'setStatus').mockImplementation(() => {});

      PublicReportingAPI.setStatusInterrupted();

      expect(spySetStatus).toHaveBeenCalledWith(RP_STATUSES.INTERRUPTED);
    });

    it('setStatusCancelled: should call setStatus method with "cancelled" status', function() {
      const spySetStatus = jest.spyOn(ClientPublicReportingAPI, 'setStatus').mockImplementation(() => {});

      PublicReportingAPI.setStatusCancelled();

      expect(spySetStatus).toHaveBeenCalledWith(RP_STATUSES.CANCELLED);
    });

    it('setStatusInfo: should call setStatus method with "info" status', function() {
      const spySetStatus = jest.spyOn(ClientPublicReportingAPI, 'setStatus').mockImplementation(() => {});

      PublicReportingAPI.setStatusInfo();

      expect(spySetStatus).toHaveBeenCalledWith(RP_STATUSES.INFO);
    });

    it('setStatusWarn: should call setStatus method with "warn" status', function() {
      const spySetStatus = jest.spyOn(ClientPublicReportingAPI, 'setStatus').mockImplementation(() => {});

      PublicReportingAPI.setStatusWarn();

      expect(spySetStatus).toHaveBeenCalledWith(RP_STATUSES.WARN);
    });

    it('setLaunchStatusPassed: should call setLaunchStatus method with "passed" status', function() {
      const spyLaunchStatus = jest.spyOn(ClientPublicReportingAPI, 'setLaunchStatus').mockImplementation(() => {});

      PublicReportingAPI.setLaunchStatusPassed();

      expect(spyLaunchStatus).toHaveBeenCalledWith(RP_STATUSES.PASSED);
    });

    it('setLaunchStatusFailed: should call setLaunchStatus method with "failed" status', function() {
      const spyLaunchStatus = jest.spyOn(ClientPublicReportingAPI, 'setLaunchStatus').mockImplementation(() => {});

      PublicReportingAPI.setLaunchStatusFailed();

      expect(spyLaunchStatus).toHaveBeenCalledWith(RP_STATUSES.FAILED);
    });

    it('setLaunchStatusSkipped: should call setLaunchStatus method with "skipped" status', function() {
      const spyLaunchStatus = jest.spyOn(ClientPublicReportingAPI, 'setLaunchStatus').mockImplementation(() => {});

      PublicReportingAPI.setLaunchStatusSkipped();

      expect(spyLaunchStatus).toHaveBeenCalledWith(RP_STATUSES.SKIPPED);
    });

    it('setLaunchStatusStopped: should call setLaunchStatus method with "stopped" status', function() {
      const spyLaunchStatus = jest.spyOn(ClientPublicReportingAPI, 'setLaunchStatus').mockImplementation(() => {});

      PublicReportingAPI.setLaunchStatusStopped();

      expect(spyLaunchStatus).toHaveBeenCalledWith(RP_STATUSES.STOPPED);
    });

    it('setLaunchStatusInterrupted: should call setLaunchStatus method with "interrupted" status', function() {
      const spyLaunchStatus = jest.spyOn(ClientPublicReportingAPI, 'setLaunchStatus').mockImplementation(() => {});

      PublicReportingAPI.setLaunchStatusInterrupted();

      expect(spyLaunchStatus).toHaveBeenCalledWith(RP_STATUSES.INTERRUPTED);
    });

    it('setLaunchStatusCancelled: should call setLaunchStatus method with "cancelled" status', function() {
      const spyLaunchStatus = jest.spyOn(ClientPublicReportingAPI, 'setLaunchStatus').mockImplementation(() => {});

      PublicReportingAPI.setLaunchStatusCancelled();

      expect(spyLaunchStatus).toHaveBeenCalledWith(RP_STATUSES.CANCELLED);
    });

    it('setLaunchStatusInfo: should call setLaunchStatus method with "info" status', function() {
      const spyLaunchStatus = jest.spyOn(ClientPublicReportingAPI, 'setLaunchStatus').mockImplementation(() => {});

      PublicReportingAPI.setLaunchStatusInfo();

      expect(spyLaunchStatus).toHaveBeenCalledWith(RP_STATUSES.INFO);
    });

    it('setLaunchStatusWarn: should call setLaunchStatus method with "warn" status', function() {
      const spyLaunchStatus = jest.spyOn(ClientPublicReportingAPI, 'setLaunchStatus').mockImplementation(() => {});

      PublicReportingAPI.setLaunchStatusWarn();

      expect(spyLaunchStatus).toHaveBeenCalledWith(RP_STATUSES.WARN);
    });
  });
});
