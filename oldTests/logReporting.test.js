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

const EventEmitter = require('events')
const { getDefaultConfig, RPClient, mockedDate } = require('./mocks')
const ReportportalAgent = require('./../lib/mochaReporter')

describe('logs reporting', function () {
  let reporter
  let file

  beforeAll(function () {
    const options = getDefaultConfig()
    const runner = new EventEmitter()
    reporter = new ReportportalAgent(runner, options)
    reporter.rpClient = new RPClient(options)
    reporter.launchId = 'tempLaunchId'
    reporter.suitesStackTempId = ['tempRootSuiteId', 'tempSuiteId']

    file = {
      name: 'filename',
      type: 'image/png',
      content: Buffer.from([1, 2, 3, 4, 5, 6, 7]).toString('base64'),
    }
  })

  afterEach(function () {
    reporter.currentTest = null
    reporter.hookIds.clear()
    jest.clearAllMocks()
  })

  describe('sendLog', function () {
    it('should send log fr current test with specified params', function () {
      const spySendLog = jest.spyOn(reporter.rpClient, 'sendLog')
      const currentTest = {
        title: 'test',
        tempId: 'testItemId',
      }

      const log = {
        level: 'ERROR',
        message: 'info log',
        file,
      }
      const expectedSendLogObj = {
        time: mockedDate,
        level: 'ERROR',
        message: 'info log',
      }
      reporter.currentTest = currentTest

      reporter.sendTestItemLog({ log })

      expect(spySendLog).toHaveBeenCalledWith(
        'testItemId',
        expectedSendLogObj,
        file
      )
    })

    it('should send log to suite with specified params', function () {
      const spySendLog = jest.spyOn(reporter.rpClient, 'sendLog')
      const log = {
        level: 'ERROR',
        message: 'info log',
        file,
      }
      const expectedSendLogObj = {
        time: mockedDate,
        level: 'ERROR',
        message: 'info log',
      }

      reporter.sendTestItemLog({ log })

      expect(spySendLog).toHaveBeenCalledWith(
        'tempSuiteId',
        expectedSendLogObj,
        file
      )
    })
  })
  describe('sendLaunchLog', function () {
    it('should send log to launch with specified params', function () {
      const spySendLog = jest.spyOn(reporter.rpClient, 'sendLog')
      const log = {
        level: 'ERROR',
        message: 'info log',
        file,
      }
      const expectedSendLogObj = {
        time: mockedDate,
        level: 'ERROR',
        message: 'info log',
      }

      reporter.sendLaunchLog({ log })

      expect(spySendLog).toHaveBeenCalledWith(
        'tempLaunchId',
        expectedSendLogObj,
        file
      )
    })
  })
})
