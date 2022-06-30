import { HOST, PORT } from './constants/event-setver-settings'
import { Server, createServer } from 'http'
const Mocha = require('Mocha')
import { PrParallelRunClient } from './pr-parallel-run-client'
import { TEST_STATUSES } from './constants/testStatuses'
import { getTimeStamp } from './utils'
import { MochaEvent } from './interfaces/mocha-event.interface'
import { LoggerEvent } from './interfaces/logger-event.interface'
const path = require('path')
const fs = require('fs')
const {
  EVENTS,
} = require('@reportportal/client-javascript/lib/constants/events')
const { poll, TestConstants } = require('@rtly-sdet/utils')

const { entityType, hookTypes, hookTypesMap } = require('./constants/itemTypes')
const logLevels = require('./constants/logLevels')
const { getCodeRef, getAgentInfo } = require('./utils')

const {
  EVENT_RUN_BEGIN,
  EVENT_RUN_END,
  EVENT_TEST_BEGIN,
  EVENT_TEST_FAIL,
  EVENT_TEST_END,
  EVENT_TEST_PENDING,
  EVENT_SUITE_BEGIN,
  EVENT_SUITE_END,
  EVENT_HOOK_BEGIN,
  EVENT_HOOK_END,
} = Mocha.Runner.constants

const promiseErrorHandler = (promise, message = '') =>
  promise.catch((err) => {
    // eslint-disable-next-line no-console
    console.error(message, err)
  })

export class ReportportalParallelRunAgent extends Mocha.reporters.Base {
  private rpClient: any
  private launchCounter: number
  private suitesInfo: Map<any, any>
  private suitesData: any[]
  private testsInfo: Map<any, any>
  private createdHookIds: Map<any, any>
  private deletedHookIds: string[] = []
  private testMochaIds: any[]
  private attributes: Map<any, any>
  private descriptions: Map<any, any>
  private testItemStatuses: Map<any, any>
  private options: any
  private isLaunchStarted: boolean
  private isLaunchFinished: boolean
  private readonly server: Server | undefined
  private launchId: string | undefined
  private launchStatus: string | undefined

  constructor(runner, options) {
    super(runner, options)
    const agentInfo = getAgentInfo()
    this.rpClient = new PrParallelRunClient(options.reporterOptions, agentInfo)
    this.launchCounter = 0
    this.suitesInfo = new Map()
    this.suitesData = []
    this.testsInfo = new Map()
    this.createdHookIds = new Map()
    this.testMochaIds = []
    this.attributes = new Map()
    this.descriptions = new Map()
    this.testItemStatuses = new Map()
    this.options = options
    this.isLaunchStarted = false
    this.isLaunchFinished = false

    runner.on(EVENT_RUN_BEGIN, () =>
      this.onLaunchStart({ timeStamp: getTimeStamp() })
    )

    runner.on(EVENT_RUN_END, () =>
      this.onLaunchFinish({ timeStamp: getTimeStamp() })
    )

    runner.on(EVENT_SUITE_BEGIN, (suite) =>
      this.onSuiteStart({ timeStamp: getTimeStamp(), item: suite })
    )

    runner.on(EVENT_SUITE_END, (suite) =>
      this.onSuiteFinish({ timeStamp: getTimeStamp(), item: suite })
    )

    runner.on(EVENT_TEST_BEGIN, (test) =>
      this.onTestStart({ timeStamp: getTimeStamp(), item: test })
    )

    runner.on(EVENT_TEST_FAIL, (test, err) =>
      this.onTestFail({ timeStamp: getTimeStamp(), item: test, error: err })
    )

    runner.on(EVENT_TEST_PENDING, (test) =>
      this.onTestPending({ timeStamp: getTimeStamp(), item: test })
    )

    runner.on(EVENT_TEST_END, (test) =>
      this.onTestFinish({ timeStamp: getTimeStamp(), item: test })
    )

    runner.on(EVENT_HOOK_BEGIN, (hook) =>
      this.onHookStart({ timeStamp: getTimeStamp(), item: hook })
    )

    runner.on(EVENT_HOOK_END, (hook) =>
      this.onHookFinish({
        timeStamp: getTimeStamp(),
        item: hook,
        status: TEST_STATUSES.PASSED,
      })
    )

    if (!options.reporterOptions.dontLaunchServer) {
      this.server = createServer((req, res) => {
        let data = ''
        req.on('data', (chunk) => {
          data += chunk
        })
        req.on('end', () => {
          res.writeHead(200)
          res.end(`{}`)
          const logEvent = data as unknown as LoggerEvent
          if (logEvent.event === EVENTS.ADD_LOG) this.sendTestItemLog(logEvent)
        })
      })
      this.server.listen(PORT, HOST, () => {})
    }
  }

  async sendTestItemLog(logData) {
    const testId = await this.getTestId(logData.testData)
    if (logData.log.file !== undefined)
      logData.log.file = this.attachFile(logData.log.file)
    this.sendLog(testId, logData.log)
  }

  // eslint-disable-next-line class-methods-use-this
  attachFile(filePath) {
    const filename = path.parse(filePath).base
    const extension = filename.split('.').pop()
    const data = fs.readFileSync(filePath, {
      encoding: 'base64',
    })
    return {
      name: filename,
      type:
        extension.toLowerCase() === 'json' ? 'application/json' : 'image/png',
      content: data.toString(),
    }
  }

  async getTestId(testData) {
    let testMockhId
    let testReportPortalId
    // eslint-disable-next-line consistent-return
    const pollFn = async () => {
      if (this.suitesData.length > 0) {
        // eslint-disable-next-line no-param-reassign,no-return-assign,no-shadow
        const suite = this.suitesData.find(
          (suite) => suite.title === testData.suite
        )
        if (suite !== undefined) {
          // eslint-disable-next-line no-shadow
          const test = suite.tests.find((test) => test.title === testData.test)
          if (test !== undefined) {
            testMockhId = this.getMochaId(test)
            return true
          }
        }
      }
      return false
    }
    await poll(pollFn, 50, 30 * 1000)
    const pollFn2 = async () => {
      const size = this.testsInfo.size
      if (size > 0) {
        if (this.testsInfo.has(testMockhId)) {
          // eslint-disable-next-line no-shadow
          const testData = this.testsInfo.get(testMockhId)
          testReportPortalId = testData.tempId
          return true
        }
        return false
      }
      return false
    }
    await poll(pollFn2, 50, 30 * 1000)
    return testReportPortalId
  }

  sendLaunchLog({ log }) {
    this.sendLog(this.launchId, log)
  }

  sendLog(tempId, log) {
    const file = log.file
    const { promise } = this.rpClient.sendLog(
      tempId,
      {
        message: log.message,
        level: log.level,
        time: this.rpClient.helpers.now(),
      },
      file
    )
    promiseErrorHandler(promise, 'Failed to send log.')
  }

  getSystemAttributes() {
    const agentInfo = getAgentInfo()
    const systemAttributes = [
      {
        key: 'agent',
        value: `${agentInfo.name}|${agentInfo.version}`,
        system: true,
      },
    ]
    if (this.options.reporterOptions.skippedIssue === false) {
      const skippedIssueAttribute = {
        key: 'skippedIssue',
        value: 'false',
        system: true,
      }
      systemAttributes.push(skippedIssueAttribute)
    }
    return systemAttributes
  }

  onLaunchStart(event: MochaEvent) {
    // eslint-disable-next-line no-plusplus
    this.launchCounter++
    if (this.launchCounter === 1) {
      const launchAttributes = this.attributes
      launchAttributes.set(`Environment`, TestConstants.testEnvironment())
      launchAttributes.set(`VerifierMode`, TestConstants.verifierMode())
      const { tempId, promise } = this.rpClient.startLaunch({
        token: this.options.reporterOptions.token,
        name: this.options.reporterOptions.launch,
        startTime: event.timeStamp,
        description: this.options.reporterOptions.description,
        rerun: this.options.reporterOptions.rerun,
        rerunOf: this.options.reporterOptions.rerunOf,
        attributes: launchAttributes,
      })
      promiseErrorHandler(promise, 'Failed to launch run.')
      this.launchId = tempId
    }
  }

  async onLaunchFinish(event: MochaEvent) {
    // eslint-disable-next-line no-plusplus
    this.launchCounter--
    if (this.launchCounter === 0) {
      const pollFn = async () => {
        const launchData = this.rpClient.map[this.launchId!]
        const suites = launchData.children
        const currentState = suites.map(
          (test) => this.rpClient.map[test].finishSend
        )
        return currentState.every((v) => v === true)
      }
      await poll(pollFn, 100, 10 * 1000)
      const { promise } = this.rpClient.finishLaunch(
        this.launchId,
        Object.assign(
          {
            endTime: event.timeStamp,
          },
          this.launchStatus && { status: this.launchStatus }
        )
      )
      this.isLaunchFinished = true
      await promiseErrorHandler(promise, 'Failed to finish run.')
      // eslint-disable-next-line global-require
      const server = require('http-shutdown')(this.server)

      // eslint-disable-next-line consistent-return
      server.shutdown(function (err) {
        if (err) {
          // eslint-disable-next-line no-console
          return console.log('shutdown failed', err.message)
        }
      })
      // eslint-disable-next-line no-console
      console.log('************* Logging maps')

      // eslint-disable-next-line no-console
      console.log('\n\n************* suitesInfo: ')
      for (const [key, value] of this.suitesInfo) {
        // eslint-disable-next-line no-console
        console.log(key, value)
      }

      // eslint-disable-next-line no-console
      console.log('\n\n************* testsInfo: ')
      for (const [key, value] of this.testsInfo) {
        // eslint-disable-next-line no-console
        console.log(key, value)
      }
      // eslint-disable-next-line no-console
      console.log(
        '\n\n************* .rpClient.map: ',
        JSON.stringify(this.rpClient.map)
      )
    }
  }

  // eslint-disable-next-line class-methods-use-this
  convertParallelRunSuite(suite) {
    try {
      const converted = suite.suites[0]
      converted.parent = null
      // eslint-disable-next-line no-underscore-dangle,no-restricted-syntax
      for (const hook of converted._beforeAll) {
        if (!hook.title.includes('generated_')) {
          if (hook.title.includes(hookTypes.BEFORE_ALL))
            hook.title = hookTypes.BEFORE_ALL
          converted.tests.push(hook)
        }
      }
      return converted
    } catch (e) {
      return undefined
    }
  }

  async onSuiteStart(event: MochaEvent) {
    const suite = event.item
    const convertedSuite = this.convertParallelRunSuite(suite)
    if (convertedSuite === undefined) return
    this.suitesData.push(convertedSuite)
    if (!convertedSuite.root) {
      const suiteMochaId = this.getMochaId(convertedSuite)
      if (!this.suitesInfo.has(suiteMochaId)) {
        const parentMochaId =
          convertedSuite.parent === null
            ? undefined
            : this.getMochaId(convertedSuite.parent)
        const parentId = parentMochaId
          ? this.getSuiteTempId(parentMochaId)
          : undefined
        const codeRef = convertedSuite.file
        const suiteObj = {
          name: convertedSuite.title,
          startTime: event.timeStamp,
          attributes: [],
          type: entityType.SUITE,
          codeRef,
        }
        const { tempId, promise } = this.rpClient.startTestItem(
          suiteObj,
          this.launchId,
          parentId
        )
        this.suitesInfo.set(suiteMochaId, {
          name: convertedSuite.title,
          tempId,
          startTime: suiteObj.startTime,
        })
        promiseErrorHandler(promise, 'Failed to create suite.')
      }
    }
  }

  async onSuiteFinish(event: MochaEvent) {
    const suite = event.item
    const convertedSuite = this.convertParallelRunSuite(suite)
    if (convertedSuite === undefined) return
    const suiteId = this.getSuiteTempId(this.getMochaId(convertedSuite))
    if (suiteId) {
      const pollFn = async () => {
        const suiteData = this.rpClient.map[suiteId]
        const tests = suiteData.children
        const currentState = tests.map(
          (test) => this.rpClient.map[test].finishCompleted
        )
        return currentState.every((v) => v === true)
      }
      await poll(pollFn, 1000, 10 * 1000)
      const suiteAttributes = this.attributes.get(suiteId)
      const suiteDescription = this.descriptions.get(suiteId)
      const suiteStatus = this.testItemStatuses.get(suiteId)
      const suiteFinishObj = Object.assign(
        {
          endTime: event.timeStamp,
        },
        suiteAttributes && { attributes: suiteAttributes },
        suiteDescription && { description: suiteDescription },
        suiteStatus && { status: suiteStatus }
      )
      const { promise } = this.rpClient.finishTestItem(suiteId, suiteFinishObj)
      const suiteMochaId = this.getMochaId(convertedSuite)
      const suiteInfo = this.suitesInfo.get(suiteMochaId)
      suiteInfo.endTime = suiteFinishObj.endTime
      this.suitesInfo.set(suiteMochaId, suiteInfo)
      promiseErrorHandler(promise, 'Failed to finish suite.')
      this.attributes.delete(suiteId)
      this.descriptions.delete(suiteId)
    }
  }

  async onTestStart(event: MochaEvent) {
    const test = event.item
    const mochaId = this.getMochaId(test)
    if (!this.testMochaIds.includes(mochaId)) {
      this.testMochaIds.push(mochaId)
      const parentId = this.getSuiteTempId(this.getMochaId(test.parent))
      const codeRef = getCodeRef(test)
      const testObj = {
        name: test.title,
        startTime: event.timeStamp,
        attributes: [],
        type: entityType.STEP,
        retry: false,
        codeRef,
      }
      const { tempId, promise } = this.rpClient.startTestItem(
        testObj,
        this.launchId,
        parentId
      )
      this.testsInfo.set(mochaId, {
        tempId,
        startTime: testObj.startTime,
        name: test.title,
        type: 'test',
      })
      promiseErrorHandler(promise, 'Failed to create child item.')
    }
  }

  async onTestFinish(event: MochaEvent) {
    // eslint-disable-next-line no-console
    console.log(
      '************ finishTest MochaEvent test.state: ',
      event.item.state
    )
    event.status =
      event.item.state === 'pending'
        ? TEST_STATUSES.SKIPPED
        : TEST_STATUSES.PASSED

    // eslint-disable-next-line no-console
    console.log(
      '************ finishTest MochaEvent event state: ',
      event.status
    )
    await this.finishTest(event)
  }

  async finishTest(event: MochaEvent) {
    // eslint-disable-next-line no-console
    console.log('************ finishTest MochaEvent: ', JSON.stringify(event))
    const test = event.item
    const mochaId = this.getMochaId(test)
    const testData = this.testsInfo.get(mochaId)
    const testId = testData.tempId

    const testFinishObj: any = {
      endTime: event.timeStamp,
      retry: test._retries > 0,
      status: event.status,
    }
    const withoutIssue =
      event.status === TEST_STATUSES.SKIPPED &&
      this.options.reporterOptions.skippedIssue === false
    if (withoutIssue) testFinishObj.issue = { issueType: 'NOT_ISSUE' }
    // eslint-disable-next-line no-console
    console.log(
      '************ finishTest testFinishObj: ',
      JSON.stringify(testFinishObj)
    )
    const { promise } = this.rpClient.finishTestItem(testId, testFinishObj)
    testData.endTime = testFinishObj.endTime
    testData.testStatus = testFinishObj.status
    this.testsInfo.set(mochaId, testData)
    promiseErrorHandler(promise, 'Failed to finish child item.')
  }

  async getHookStartTime(hook, hookRPType, parentId) {
    let parentStartTime = 0
    const pollFn = async () => {
      if (this.suitesInfo.has(parentId)) {
        parentStartTime = this.suitesInfo.get(parentId).startTime
        return true
      }
      return false
    }
    await poll(pollFn, 100, 10 * 1000)
    if (hookRPType === entityType.BEFORE_METHOD) {
      return parentStartTime
    }

    if (hookRPType === entityType.BEFORE_SUITE) {
      const hookSuite = this.suitesInfo.get(hook.parent)
      const hookStartTime =
        (hookSuite && hookSuite.startTime) || this.rpClient.helpers.now()
      return Math.max(hookStartTime - 1, parentStartTime)
    }

    return this.rpClient.helpers.now()
  }

  async onHookStart(event: MochaEvent) {
    const hook = event.item
    if (!this.options.reporterOptions.reportHooks) return
    if (!hook.parent) return
    if (hook.title.includes('generated_')) return
    if (hook.title.includes('root')) return
    const mochaId = this.getMochaId(hook)
    if (this.createdHookIds.has(mochaId)) return
    const hookTypeRegEx: RegExp = new RegExp(Object.values(hookTypes).join('|'))
    const hookMochaType = hookTypeRegEx.exec(hook.title)![0]
    const hookRPType = hookTypesMap[hookMochaType]
    const hookName = hook.title.replace(`"${hookMochaType}" hook:`, '').trim()
    const parentId = this.getSuiteTempId(this.getMochaId(hook.parent))
    const hookStartObj = {
      name: hookName,
      startTime: event.timeStamp - 1, //await this.getHookStartTime(hook, hookRPType, parentId),
      type: hookRPType,
    }
    const { tempId, promise } = this.rpClient.startTestItem(
      hookStartObj,
      this.launchId,
      parentId
    )
    this.createdHookIds.set(mochaId, tempId)
    promiseErrorHandler(promise, 'Failed to start hook.')
    this.testsInfo.set(mochaId, {
      tempId,
      startTime: hookStartObj.startTime,
      name: hookName,
      type: 'hook',
    })
  }

  async onHookFinish(event: MochaEvent) {
    const hook = event.item
    if (!this.options.reporterOptions.reportHooks) return
    const mochaId = this.getMochaId(hook)
    if (this.deletedHookIds.includes(mochaId)) return
    if (this.createdHookIds.get(mochaId) !== undefined) {
      const hookId = this.createdHookIds.get(mochaId)
      if (hookId) {
        this.deletedHookIds.push(mochaId)
        const response = this.rpClient.finishTestItem(hookId, {
          status: event.status,
          endTime: event.timeStamp,
        })
        const hookData = this.testsInfo.get(mochaId)
        hookData.endTime = event.timeStamp
        hookData.testStatus = event.status
        this.testsInfo.set(mochaId, hookData)
        const { promise } = response
        await promiseErrorHandler(promise, 'Failed to finish hook')
      }
    }
  }

  async onTestPending(event: MochaEvent) {
    // eslint-disable-next-line no-console
    console.log(
      '************ onTestPending MochaEvent: ',
      JSON.stringify(event)
    )

    if (!this.testsInfo.has(this.getMochaId(event.item)))
      await this.onTestStart(event)
    event.status = TEST_STATUSES.SKIPPED
    await this.finishTest(event)
  }

  async onTestFail(event: MochaEvent) {
    const test = event.item
    this.launchStatus = TEST_STATUSES.FAILED
    event.status = TEST_STATUSES.FAILED
    let tempId = 0
    const pollFn = async () => {
      if (this.testsInfo.has(this.getMochaId(test))) {
        tempId = this.testsInfo.get(this.getMochaId(test)).tempId
        return true
      }
      return false
    }
    await poll(pollFn, 100, 10 * 1000)
    await this.sendError(tempId, event.error)
    if (test.type === 'hook') {
      if (this.options.reporterOptions.reportHooks) {
        this.onHookFinish(event)
      }
    } else this.finishTest(event)
  }

  async sendError(tempItemId, err) {
    const { promise } = this.rpClient.sendLog(tempItemId, {
      level: logLevels.ERROR,
      message: err.stack || err.message || err.toString(),
    })
    await promiseErrorHandler(promise, 'Failed to send error log')
  }

  getSuiteTempId(mochaId) {
    const suiteInfo = this.suitesInfo.get(mochaId)
    return suiteInfo && suiteInfo.tempId
  }

  getMochaId(test) {
    return test.__mocha_id__
  }
}
