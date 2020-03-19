const ClientPublicReportingAPI = require('reportportal-client/lib/publicReportingAPI');
const LOG_LEVELS = require('./constants/logLevels');

const PublicReportingAPI = {
  log: (level = LOG_LEVELS.INFO, message = '', file) =>
    ClientPublicReportingAPI.addLog({ level, file, message }),
  launchLog: (level = LOG_LEVELS.INFO, message = '', file) =>
    ClientPublicReportingAPI.addLaunchLog({ level, file, message }),
  trace: (message, file) => PublicReportingAPI.log(LOG_LEVELS.TRACE, message, file),
  debug: (message, file) => PublicReportingAPI.log(LOG_LEVELS.DEBUG, message, file),
  info: (message, file) => PublicReportingAPI.log(LOG_LEVELS.INFO, message, file),
  warn: (message, file) => PublicReportingAPI.log(LOG_LEVELS.WARN, message, file),
  error: (message, file) => PublicReportingAPI.log(LOG_LEVELS.ERROR, message, file),
  fatal: (message, file) => PublicReportingAPI.log(LOG_LEVELS.FATAL, message, file),
};

module.exports = PublicReportingAPI;
