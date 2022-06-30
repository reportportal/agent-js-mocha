const Mocha = require('Mocha')
import { ReportportalParallelRunAgent } from './reportportal-parallel-run-agent'
import { OptionsSource } from './options-source'
const ReportportalAgent = require('@reportportal/agent-js-mocha/lib/mochaReporter')

export class ReportportalReporter extends Mocha.reporters.Base {
  constructor(runner, options) {
    super(runner, options)
    OptionsSource.setOptions(options)
    if (options.parallel === true)
      return new ReportportalParallelRunAgent(runner, options)
    return new ReportportalAgent(runner, options)
  }
}
