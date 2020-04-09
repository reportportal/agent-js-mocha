const ClientPublicReportingAPI = require('reportportal-client/lib/publicReportingAPI');
const LOG_LEVELS = require('./constants/logLevels');

const PublicReportingAPI = {
  log: (level = LOG_LEVELS.INFO, message = '', file) =>
    ClientPublicReportingAPI.addLog({ log: { level, file, message } }),
  launchLog: (level = LOG_LEVELS.INFO, message = '', file) =>
    ClientPublicReportingAPI.addLaunchLog({ log: { level, file, message } }),
  trace: (message, file) => PublicReportingAPI.log(LOG_LEVELS.TRACE, message, file),
  debug: (message, file) => PublicReportingAPI.log(LOG_LEVELS.DEBUG, message, file),
  info: (message, file) => PublicReportingAPI.log(LOG_LEVELS.INFO, message, file),
  warn: (message, file) => PublicReportingAPI.log(LOG_LEVELS.WARN, message, file),
  error: (message, file) => PublicReportingAPI.log(LOG_LEVELS.ERROR, message, file),
  fatal: (message, file) => PublicReportingAPI.log(LOG_LEVELS.FATAL, message, file),
  launchTrace: (message, file) => PublicReportingAPI.launchLog(LOG_LEVELS.TRACE, message, file),
  launchDebug: (message, file) => PublicReportingAPI.launchLog(LOG_LEVELS.DEBUG, message, file),
  launchInfo: (message, file) => PublicReportingAPI.launchLog(LOG_LEVELS.INFO, message, file),
  launchWarn: (message, file) => PublicReportingAPI.launchLog(LOG_LEVELS.WARN, message, file),
  launchError: (message, file) => PublicReportingAPI.launchLog(LOG_LEVELS.ERROR, message, file),
  launchFatal: (message, file) => PublicReportingAPI.launchLog(LOG_LEVELS.FATAL, message, file),
  addAttributes: ClientPublicReportingAPI.addAttributes,
  setDescription: ClientPublicReportingAPI.setDescription,
};

module.exports = PublicReportingAPI;
