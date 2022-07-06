import { expect } from 'chai'
import { ReportportalReporter } from '../src/reportportal-reporter'
import { getDefaultOptions } from './mocks'
import { ReportportalParallelRunAgent } from '../src/reportportal-parallel-run-agent'

const EventEmitter = require('events')
const ReportportalAgent = require('@reportportal/agent-js-mocha/lib/mochaReporter')

describe('ReportportalAgent test', () => {
  it('Get ReportportalParallelRunAgent', async () => {
    const runner = new EventEmitter()
    const reporter = new ReportportalReporter(runner, getDefaultOptions())
    expect(reporter instanceof ReportportalParallelRunAgent).eql(true)
  })

  it('Get ReportportalAgent', async () => {
    const options: any = getDefaultOptions()
    delete options.parallel
    const runner = new EventEmitter()
    const reporter = new ReportportalReporter(runner, options)
    expect(reporter instanceof ReportportalAgent).eql(true)
  })
})
