import { HOST, PORT } from './constants/event-setver-settings'
import { Server, createServer } from 'http'
const Mocha = require('Mocha')
import { PrParallelRunClient } from './pr-parallel-run-client'
import { TEST_STATUSES } from './constants/testStatuses'
import { getTimeStamp } from './utils'
import { MochaEvent } from './interfaces/mocha-event.interface'
import { LoggerEvent } from './interfaces/logger-event.interface'
import { LaunchData } from './launch-data'
const path = require('path')
const fs = require('fs')
const {
  EVENTS,
} = require('@reportportal/client-javascript/lib/constants/events')
const { TestConstants } = require('@rtly-sdet/utils')

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
  private readonly rpClient: any
  private launchData: LaunchData
  private options: any
  private readonly server: Server | undefined
  private readonly attributes: Map<any, any>
  private descriptions: Map<any, any>

  constructor(runner, options) {
    super(runner, options)
    const agentInfo = getAgentInfo()
    this.rpClient = new PrParallelRunClient(options.reporterOptions, agentInfo)
    this.launchData = new LaunchData(this.rpClient, options.reporterOptions)
    this.attributes = new Map()
    this.descriptions = new Map()
    this.options = options

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
          const logEvent: any = JSON.parse(data) as LoggerEvent
          if (logEvent.event === EVENTS.ADD_LOG) this.sendTestItemLog(logEvent)
        })
      })
      this.server.listen(PORT, HOST, () => {})
    }
  }

  async sendTestItemLog(logData) {
    const testId = await this.launchData.findItemByName(logData.testData)
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
    this.launchData.bumpLaunchCounter()
    if (this.launchData.isFirstLaunch()) {
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
      this.launchData.launchId = tempId
    }
  }

  async onLaunchFinish(event: MochaEvent) {
    this.launchData.decreaseLaunchCounter()
    if (this.launchData.isLastLaunch()) {
      const server = require('http-shutdown')(this.server)
      server.shutdown(function (err) {
        if (err) {
          promiseErrorHandler(err, 'Failed to shutdown server.')
        }
      })
      await this.launchData.waitTillAllChildrenFinished(this.launchId!)
      const { promise } = this.rpClient.finishLaunch(this.launchData.launchId, {
        endTime: event.timeStamp,
        status: this.launchData.launchStatus,
      })
      await promiseErrorHandler(promise, 'Failed to finish run.')
      this.launchData.printLaunchData()
    }
  }

  async onSuiteStart(event: MochaEvent) {
    const suite = event.item
    const convertedSuite = this.launchData.convertParallelRunSuite(suite)
    if (this.launchData.passedSuiteCreationFilter(convertedSuite)) {
      const parentId = this.launchData.getSuiteTempId(convertedSuite.parent)
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
        this.launchData.launchId,
        parentId
      )
      this.launchData.addSuiteInfo(convertedSuite, {
        name: convertedSuite.title,
        tempId,
        startTime: suiteObj.startTime,
      })
      promiseErrorHandler(promise, 'Failed to create suite.')
    }
  }

  async onSuiteFinish(event: MochaEvent) {
    const suite = event.item
    const convertedSuite = this.launchData.convertParallelRunSuite(suite)
    const suiteId = this.launchData.getSuiteTempId(convertedSuite)
    if (suiteId) {
      await this.launchData.waitTillAllChildrenFinished(suiteId)
      const suiteFinishObj = {
        endTime: event.timeStamp,
        status: this.launchData.getSuiteStatus(suiteId),
      }
      const { promise } = this.rpClient.finishTestItem(suiteId, suiteFinishObj)
      this.launchData.updateSuiteInfo(convertedSuite, {
        endTime: suiteFinishObj.endTime,
      })
      promiseErrorHandler(promise, 'Failed to finish suite.')
    }
  }

  async onTestStart(event: MochaEvent) {
    const test = event.item
    if (this.launchData.passedTestCreationFilter(test)) {
      const parentId = this.launchData.getSuiteTempId(test.parent)
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
        this.launchData.launchId,
        parentId
      )
      this.launchData.addTestInfo(test, {
        tempId,
        startTime: testObj.startTime,
        name: test.title,
        type: 'test',
      })
      promiseErrorHandler(promise, 'Failed to create child item.')
    }
  }

  async onTestFinish(event: MochaEvent) {
    event.status =
      event.item.state === 'pending'
        ? TEST_STATUSES.SKIPPED
        : event.item.state === `failed`
        ? TEST_STATUSES.FAILED
        : TEST_STATUSES.PASSED
    await this.finishTest(event)
  }

  async finishTest(event: MochaEvent) {
    const test = event.item
    const testData = this.launchData.getTestInfo(test)
    if (testData === undefined) return
    const testFinishObj: any = {
      endTime: event.timeStamp,
      retry: test._retries > 0,
      status: event.status,
    }
    this.launchData.updateTestInfo(test, {
      endTime: testFinishObj.endTime,
      testStatus: testFinishObj.status,
    })
    const withoutIssue =
      event.status === TEST_STATUSES.SKIPPED &&
      this.options.reporterOptions.skippedIssue === false
    if (withoutIssue) testFinishObj.issue = { issueType: 'NOT_ISSUE' }
    const { promise } = this.rpClient.finishTestItem(
      testData.tempId,
      testFinishObj
    )
    promiseErrorHandler(promise, 'Failed to finish child item.')
  }

  async onHookStart(event: MochaEvent) {
    const hook = event.item
    if (this.launchData.passedHookCreationFilter(hook)) {
      const hookTypeRegEx: RegExp = new RegExp(
        Object.values(hookTypes).join('|')
      )
      const hookMochaType = hookTypeRegEx.exec(hook.title)![0]
      const hookRPType = hookTypesMap[hookMochaType]
      const hookName = hook.title.replace(`"${hookMochaType}" hook:`, '').trim()
      const parentId = this.launchData.getSuiteTempId(hook.parent)
      const hookStartObj = {
        name: hookName,
        startTime: event.timeStamp, //await this.getHookStartTime(hook, hookRPType, parentId),
        type: hookRPType,
      }
      const { tempId, promise } = this.rpClient.startTestItem(
        hookStartObj,
        this.launchData.launchId,
        parentId
      )
      this.launchData.addTestInfo(hook, {
        tempId,
        startTime: hookStartObj.startTime,
        name: hookName,
        type: 'hook',
        hookType: hookRPType,
        hookTitle: hook.title.includes(hookTypes.BEFORE_ALL)
          ? hookTypes.BEFORE_ALL
          : hookTypes.AFTER_ALL,
      })
      promiseErrorHandler(promise, 'Failed to start hook.')
    }
  }

  async onHookFinish(event: MochaEvent) {
    const hook = event.item
    if (!this.options.reporterOptions.reportHooks) return
    const hookData = this.launchData.getTestInfo(hook)
    if (hookData === undefined) return
    this.launchData.updateTestInfo(hook, {
      endTime: event.timeStamp,
      testStatus: event.status,
    })
    const { promise } = this.rpClient.finishTestItem(hookData.tempId, {
      status: event.status,
      endTime: event.timeStamp,
    })
    await promiseErrorHandler(promise, 'Failed to finish hook')
  }

  async onTestPending(event: MochaEvent) {
    if (this.launchData.getTestInfo(event.item) === undefined)
      await this.onTestStart(event)
    event.status = TEST_STATUSES.SKIPPED
    await this.finishTest(event)
  }

  async onTestFail(event: MochaEvent) {
    const test = event.item
    this.launchData.launchStatus = TEST_STATUSES.FAILED
    event.status = TEST_STATUSES.FAILED
    const tempId = (await this.launchData.waitTestInfo(event.item)).tempId
    await this.sendError(tempId, event.error)
    if (test.type === 'hook') {
      if (this.options.reporterOptions.reportHooks) {
        this.onHookFinish(event)
      }
    } else this.finishTest(event)
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

  async sendError(tempItemId, err) {
    const { promise } = this.rpClient.sendLog(tempItemId, {
      level: logLevels.ERROR,
      message: err.stack || err.message || err.toString(),
    })
    await promiseErrorHandler(promise, 'Failed to send error log')
  }
}
