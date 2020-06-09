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
const { RP_STATUSES } = require('@reportportal/client-javascript/lib/constants/statuses');
const LOG_LEVELS = require('./constants/logLevels');

const PublicReportingAPI = {
  log: (level = LOG_LEVELS.INFO, message = '', file) =>
    ClientPublicReportingAPI.addLog({ level, file, message }),
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
  setTestCaseId: ClientPublicReportingAPI.setTestCaseId,
  setStatus: ClientPublicReportingAPI.setStatus,
  setLaunchStatus: ClientPublicReportingAPI.setLaunchStatus,
  setStatusPassed: () => ClientPublicReportingAPI.setStatus(RP_STATUSES.PASSED),
  setStatusFailed: () => ClientPublicReportingAPI.setStatus(RP_STATUSES.FAILED),
  setStatusSkipped: () => ClientPublicReportingAPI.setStatus(RP_STATUSES.SKIPPED),
  setStatusStopped: () => ClientPublicReportingAPI.setStatus(RP_STATUSES.STOPPED),
  setStatusInterrupted: () => ClientPublicReportingAPI.setStatus(RP_STATUSES.INTERRUPTED),
  setStatusCancelled: () => ClientPublicReportingAPI.setStatus(RP_STATUSES.CANCELLED),
  setStatusInfo: () => ClientPublicReportingAPI.setStatus(RP_STATUSES.INFO),
  setStatusWarn: () => ClientPublicReportingAPI.setStatus(RP_STATUSES.WARN),
  setLaunchStatusPassed: () => ClientPublicReportingAPI.setLaunchStatus(RP_STATUSES.PASSED),
  setLaunchStatusFailed: () => ClientPublicReportingAPI.setLaunchStatus(RP_STATUSES.FAILED),
  setLaunchStatusSkipped: () => ClientPublicReportingAPI.setLaunchStatus(RP_STATUSES.SKIPPED),
  setLaunchStatusStopped: () => ClientPublicReportingAPI.setLaunchStatus(RP_STATUSES.STOPPED),
  setLaunchStatusInterrupted: () =>
    ClientPublicReportingAPI.setLaunchStatus(RP_STATUSES.INTERRUPTED),
  setLaunchStatusCancelled: () => ClientPublicReportingAPI.setLaunchStatus(RP_STATUSES.CANCELLED),
  setLaunchStatusInfo: () => ClientPublicReportingAPI.setLaunchStatus(RP_STATUSES.INFO),
  setLaunchStatusWarn: () => ClientPublicReportingAPI.setLaunchStatus(RP_STATUSES.WARN),
};

module.exports = PublicReportingAPI;
