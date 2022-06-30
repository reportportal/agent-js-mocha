import { expect } from 'chai'
import { ReportportalReporter } from '../src/reportportal-reporter'
import { getDefaultOptions } from './mocks'
const EventEmitter = require('events')

describe('constructor', function () {
  it('should create RP client instance with passed options', function () {
    const runner = new EventEmitter()
    const options = getDefaultOptions()
    const reporter = new ReportportalReporter(runner, options)
    expect(reporter.options).eql(options)
  })

  it('should override default options', function () {
    const options = getDefaultOptions()
    options.reporterOptions.launch = 'NewLaunchName'
    options.reporterOptions.rerun = true
    const runner = new EventEmitter()
    const reporter = new ReportportalReporter(runner, options)
    expect(reporter.options.reporterOptions.launch).eql('NewLaunchName')
    expect(reporter.options.reporterOptions.rerun).eql(true)
  })
})
