import { hookTypes } from '../constants/itemTypes'
import { HOST, PORT } from '../constants/event-setver-settings'
import { LOG_LEVELS } from '../constants/logLevels'
import { HttpClient } from '@rtly-sdet/utils'
import {
  LoggerEvent,
  TestObjectData,
} from '../interfaces/logger-event.interface'
import { getTimeStamp } from '../utils'

const {
  EVENTS,
} = require('@reportportal/client-javascript/lib/constants/events')

function createTestData(test): TestObjectData {
  if (test.type === 'hook') {
    const testName = test.ctx.test.parent.title.includes(hookTypes.BEFORE_ALL)
      ? hookTypes.BEFORE_ALL
      : hookTypes.AFTER_ALL
    return { test: testName, suite: test.ctx.test.parent.title }
  }
  return { test: test.ctx.test.title, suite: test.ctx.test.parent.title }
}

export class ParallelReportingAPI {
  public log(test, level = LOG_LEVELS.INFO, message = '', file) {
    const body: LoggerEvent = {
      testObjectData: createTestData(test),
      timeStamp: getTimeStamp(),
      event: EVENTS.ADD_LOG,
      log: { level, file, message },
    }
    const url = `http://${HOST}:${PORT}/`
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const headers = { 'x-api-version': '2020-08' }
    const httpClient = new HttpClient()
    httpClient.post(url, 'sdet-reportportal-agent', headers, body)
  }
  public trace(test, message, file) {
    this.log(test, LOG_LEVELS.TRACE, message, file)
  }
  public debug(test, message, file) {
    this.log(test, LOG_LEVELS.DEBUG, message, file)
  }
  public info(test, message, file) {
    this.log(test, LOG_LEVELS.INFO, message, file)
  }
  public warn(test, message, file) {
    this.log(test, LOG_LEVELS.WARN, message, file)
  }
  public error(test, message, file) {
    this.log(test, LOG_LEVELS.ERROR, message, file)
  }
  public fatal(test, message, file) {
    this.log(test, LOG_LEVELS.FATAL, message, file)
  }
}
