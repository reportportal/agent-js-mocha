import { expect } from 'chai'
import { ReportportalReporter } from '../src/reportportal-reporter'
import { getDefaultOptions } from './mocks'
import { ReportingAPI } from '../src/api/public-reporting-API'
import { ParallelReportingAPI } from '../src/api/parallel-reporting-API'
const EventEmitter = require('events')

describe('ReportingAPI test', () => {
  it('Get ParallelReportingAPI for parallel run', async () => {
    const runner = new EventEmitter()
    new ReportportalReporter(runner, getDefaultOptions())
    const reportingAPI = ReportingAPI()
    // eslint-disable-next-line no-console
    console.log('reportingAPI: ', JSON.stringify(reportingAPI))
    expect(reportingAPI instanceof ParallelReportingAPI).eql(true)
  })

  it('Get PublicReportingAPI', async () => {
    const options: any = getDefaultOptions()
    delete options.parallel
    const runner = new EventEmitter()
    new ReportportalReporter(runner, options)
    const reportingAPI = ReportingAPI()
    expect(reportingAPI instanceof ParallelReportingAPI).eql(false)
  })
})
