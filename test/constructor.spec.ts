import { expect } from 'chai'
import { ReportportalReporter } from '../src/reportportal-reporter'
import { getDefaultOptions } from './mocks'
import EventEmitter from 'events'

describe('constructor', function () {
  it('should create RP client instance with passed options', function () {
    const runner = new EventEmitter()
    const options: any = getDefaultOptions()
    const reporter = new ReportportalReporter(runner, options)
    const reporterOptions: any = reporter.options
    expect(reporterOptions).eql(options)
  })

  it('should override default options', function () {
    const options: any = getDefaultOptions()
    options.reporterOptions.launch = 'NewLaunchName'
    options.reporterOptions.rerun = true
    const runner = new EventEmitter()
    const reporter = new ReportportalReporter(runner, options)
    const reporterOptions: any = reporter.options.reporterOptions
    expect(reporterOptions.launch).eql('NewLaunchName')
    expect(reporterOptions.rerun).eql(true)
  })
})
