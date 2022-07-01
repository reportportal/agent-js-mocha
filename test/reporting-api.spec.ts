import { expect } from 'chai'
import { ReportportalReporter } from '../src/reportportal-reporter'
import { getDefaultOptions } from './mocks'
import { ReportingAPI } from '../src/api/public-reporting-API'
const EventEmitter = require('events')

describe('ReportingAPI test', () => {
  it('Get ParallelReportingAPI for parallel run', async () => {
    const runner = new EventEmitter()
    new ReportportalReporter(runner, getDefaultOptions())
    const reportingAPI = ReportingAPI()
    expect(reportingAPI.name()).eql('ParallelReportingAPI')
  })

  it('Get PublicReportingAPI', async () => {
    const options: any = getDefaultOptions()
    delete options.parallel
    const runner = new EventEmitter()
    new ReportportalReporter(runner, options)
    const reportingAPI = ReportingAPI()
    try {
      reportingAPI.name()
      throw new Error('reportingAPI.name() unexpected passed without error')
    } catch (e) {
      expect(
        (e as Error).message.includes('reportingAPI.name is not a function')
      ).eql(true)
    }
  })
})
