import { HOST, PORT } from '../constants/event-setver-settings'
import { LOG_LEVELS } from '../constants/logLevels'
import { HttpClient } from '@rtly-sdet/utils'
import { TestObjectData } from '../interfaces/logger-event.interface'

const {
  EVENTS,
} = require('@reportportal/client-javascript/lib/constants/events')

function createTestData(test): TestObjectData {
  const testName = test.type === 'hook' ? 'before all' : test.ctx.test.title
  return { test: testName, suite: test.ctx.test.parent.title }
}
const ParallelReportingApi = {
  name: () => 'ParallelReportingAPI',
  log: (test, level = LOG_LEVELS.INFO, message = '', file) => {
    const boby = {
      testData: createTestData(test),
      event: EVENTS.ADD_LOG,
      log: { level, file, message },
    }
    const url = `http://${HOST}:${PORT}/`
    const httpClient = new HttpClient()
    httpClient.post(url, 'sdet-utils', {}, boby)
  },
  trace: (test, message, file) =>
    ParallelReportingApi.log(test, LOG_LEVELS.TRACE, message, file),
  debug: (test, message, file) =>
    ParallelReportingApi.log(test, LOG_LEVELS.DEBUG, message, file),
  info: (test, message, file) =>
    ParallelReportingApi.log(test, LOG_LEVELS.INFO, message, file),
  warn: (test, message, file) =>
    ParallelReportingApi.log(test, LOG_LEVELS.WARN, message, file),
  error: (test, message, file) =>
    ParallelReportingApi.log(test, LOG_LEVELS.ERROR, message, file),
  fatal: (test, message, file) =>
    ParallelReportingApi.log(test, LOG_LEVELS.FATAL, message, file),
}

module.exports = ParallelReportingApi
