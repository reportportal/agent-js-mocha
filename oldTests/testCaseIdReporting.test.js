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
const { getDefaultConfig, RPClient } = require('./mocks')
const ReportportalAgent = require('./../lib/mochaReporter')

describe('test case id reporting', function () {
  let reporter
  beforeAll(function () {
    const options = getDefaultConfig()
    const runner = new EventEmitter()
    reporter = new ReportportalAgent(runner, options)
    reporter.rpClient = new RPClient(options)
    reporter.suitesStackTempId = ['tempRootSuiteId', 'tempSuiteId']
  })

  afterEach(function () {
    reporter.currentTest = null
    reporter.testCaseIds.clear()
    jest.clearAllMocks()
  })

  it('onSetTestCaseId: should set test case id for current test in the testCaseIds map', function () {
    reporter.currentTest = {
      title: 'test',
      tempId: 'testItemId',
    }
    const testCaseId = 'test_case_id'
    const expectedDescriptionsMap = new Map([['testItemId', testCaseId]])

    reporter.onSetTestCaseId({ testCaseId })

    expect(reporter.testCaseIds).toEqual(expectedDescriptionsMap)
  })

  it('onSetTestCaseId: should overwrite test case id for current test in the testCaseIds map', function () {
    reporter.currentTest = {
      title: 'test',
      tempId: 'testItemId',
    }
    reporter.testCaseIds.set('testItemId', 'old_test_case_id')
    const newTestCaseId = 'new_test_case_id'

    const expectedDescriptionsMap = new Map([['testItemId', newTestCaseId]])

    reporter.onSetTestCaseId({ testCaseId: newTestCaseId })

    expect(reporter.testCaseIds).toEqual(expectedDescriptionsMap)
  })

  it('onSetTestCaseId: should set test case id for current suite in testCaseIds map', function () {
    const testCaseId = 'suite_test_case_id'
    const expectedDescriptionsMap = new Map([['tempSuiteId', testCaseId]])

    reporter.onSetTestCaseId({ testCaseId })

    expect(reporter.testCaseIds).toEqual(expectedDescriptionsMap)
  })
})
