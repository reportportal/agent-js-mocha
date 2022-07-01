import { PrParallelRunClient } from './pr-parallel-run-client'
import { poll } from '@rtly-sdet/utils'
import { hookTypes } from './constants/itemTypes'
import { TEST_STATUSES } from './constants/testStatuses'
import { TestObjectData } from './interfaces/logger-event.interface'

export class LaunchData {
  private options: any
  private readonly debug: boolean
  private rpClient: PrParallelRunClient
  public launchCounter: number
  // eslint-disable-next-line @typescript-eslint/naming-convention
  private _launchId: string | undefined
  // eslint-disable-next-line @typescript-eslint/naming-convention
  private _launchStatus: string
  private readonly suitesInfo: Map<string, any>
  private readonly testsInfo: Map<string, any>

  constructor(rpClient: PrParallelRunClient, options: any) {
    this.options = options
    this.debug = options.debug
    this.rpClient = rpClient
    this.launchCounter = 0
    this.suitesInfo = new Map()
    this.testsInfo = new Map()
    this._launchStatus = TEST_STATUSES.PASSED
  }

  private logDebug(msg) {
    if (this.debug) {
      // eslint-disable-next-line no-console
      console.log(msg)
    }
  }

  get launchId(): string | undefined {
    return this._launchId
  }

  set launchId(value: string | undefined) {
    this._launchId = value
  }

  get launchStatus(): string {
    return this._launchStatus
  }

  set launchStatus(value: string) {
    this._launchStatus = value
  }

  public bumpLaunchCounter(): void {
    this.launchCounter++
  }

  public decreaseLaunchCounter(): void {
    this.launchCounter--
  }

  public isFirstLaunch(): boolean {
    return this.launchCounter === 1
  }

  public isLastLaunch(): boolean {
    return this.launchCounter === 0
  }

  private static getMochaId(test) {
    return test.__mocha_id__
  }

  public async waitTestInfo(test: any): Promise<any> {
    let data = {}
    const pollFn = async () => {
      if (this.testsInfo.has(LaunchData.getMochaId(test))) {
        data = this.testsInfo.get(LaunchData.getMochaId(test))
        return true
      }
      return false
    }
    await poll(pollFn, 100, 10 * 1000)
    return data
  }

  public async waitSuiteInfo(test: any): Promise<any> {
    let data = {}
    const pollFn = async () => {
      if (this.suitesInfo.has(LaunchData.getMochaId(test))) {
        data = this.suitesInfo.get(LaunchData.getMochaId(test))
        return true
      }
      return false
    }
    await poll(pollFn, 100, 10 * 1000)
    return data
  }

  public getSuiteTempId(suite) {
    if (suite === undefined || suite === null) return undefined
    const mochaId = LaunchData.getMochaId(suite)
    const suiteInfo = this.suitesInfo.get(mochaId)
    return suiteInfo && suiteInfo.tempId
  }

  public async waitTillAllChildrenFinished(id) {
    const pollFn = async () => {
      const itemData = this.rpClient.map[id]
      if (itemData === undefined) return false
      const children = itemData.children
      const currentState = children.map(
        (child) => this.rpClient.map[child].finishSend
      )
      return currentState.every((v) => v === true)
    }
    await poll(pollFn, 100, 10 * 1000)
  }

  public convertParallelRunSuite(suite) {
    try {
      const converted = suite.suites[0]
      converted.parent = null
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

  public getSuiteStatus(suiteTempId): string {
    const itemData = this.rpClient.map[suiteTempId]
    const children = itemData.children
    const tests: any[] = Array.from(this.testsInfo, ([key, value]) => value)
    const childrenTests = tests.filter((test) => children.includes(test.tempId))
    const result = childrenTests.filter((test) => test.testStatus === 'failed')
    return result.length > 0 ? TEST_STATUSES.FAILED : TEST_STATUSES.PASSED
  }

  public passedSuiteCreationFilter(suite: any): boolean {
    if (suite === undefined) return false
    if (suite.root) return false
    const suiteMochaId = LaunchData.getMochaId(suite)
    return !this.suitesInfo.has(suiteMochaId)
  }

  public addSuiteInfo(suite: any, info: any) {
    const mochaId = LaunchData.getMochaId(suite)
    this.suitesInfo.set(mochaId, info)
    this.logDebug(`********** addSuiteInf data ${mochaId}: ${info}`)
  }
  public updateSuiteInfo(suite: any, info: any) {
    const mochaId = LaunchData.getMochaId(suite)
    const suiteInfo = this.suitesInfo.get(mochaId)
    this.suitesInfo.set(mochaId, { ...suiteInfo, ...info })

    this.logDebug(
      `********** updateSuiteInfo data ${mochaId}: , ${{
        ...suiteInfo,
        ...info,
      }}`
    )
  }

  public passedTestCreationFilter(test: any): boolean {
    if (test === undefined) return false
    const mochaId = LaunchData.getMochaId(test)
    return !this.testsInfo.has(mochaId)
  }

  public addTestInfo(test: any, info: any) {
    const mochaId = LaunchData.getMochaId(test)
    this.testsInfo.set(mochaId, info)
    this.logDebug(`********** addTestInfo data ${mochaId}: ${info}`)
  }
  public updateTestInfo(test: any, info: any) {
    const mochaId = LaunchData.getMochaId(test)
    const testInfo = this.testsInfo.get(mochaId)
    this.testsInfo.set(mochaId, { ...testInfo, ...info })
    this.logDebug(
      `********** updateTestInfo data ${mochaId}:  ${{
        ...testInfo,
        ...info,
      }}`
    )
  }

  public getTestInfo(test: any) {
    if (test === undefined) return undefined
    const mochaId = LaunchData.getMochaId(test)
    return this.testsInfo.get(mochaId)
  }

  public passedHookCreationFilter(hook: any): boolean {
    if (!this.options.reportHooks) return false
    if (!hook.parent) return false
    if (hook.title.includes('generated_')) return false
    if (hook.title.includes('root')) return false
    const mochaId = LaunchData.getMochaId(hook)
    return !this.testsInfo.has(mochaId)
  }

  public async findItemByName(testData: TestObjectData) {
    let testReportPortalId
    const pollFn = async () => {
      const suites: any[] = Array.from(this.suitesInfo, ([key, value]) => value)
      const suite = suites.find((suite) => suite.name === testData.suite)
      if (suite === undefined) return false
      if (testData.test === undefined) {
        testReportPortalId = suite.tempId
        return true
      }
      const children = this.rpClient.map[suite.tempId].children
      const tests: any[] = Array.from(
        this.testsInfo,
        ([key, value]) => value
      ).filter((test) => children.includes(test.tempId))
      const test = tests.find(
        (test) =>
          test.name === testData.test || test.hookTitle === testData.test
      )
      if (test === undefined) return false
      testReportPortalId = test.tempId
      return true
    }
    await poll(pollFn, 500, 10 * 1000)
    return testReportPortalId
  }

  public printLaunchData() {
    this.logDebug('************* Logging Launch Data: *************')
    this.logDebug('\n\n************* suitesInfo: ************* ')
    for (const [key, value] of this.suitesInfo) {
      this.logDebug(`${key}: ${JSON.stringify(value)}`)
    }
    this.logDebug('\n\n************* testsInfo: ************* ')
    for (const [key, value] of this.testsInfo) {
      this.logDebug(`${key}: ${JSON.stringify(value)}`)
    }
    this.logDebug('\n\n************* rpClient.map: ************* ')
    this.logDebug(JSON.stringify(this.rpClient.map))
  }
}
