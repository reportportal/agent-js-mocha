const ParallelReportingAPI = require('./parallel-reporting-API')
const PublicReportingAPI = require('@reportportal/agent-js-mocha/lib/publicReportingAPI')
import { Log, LogComponent } from '@rtly-sdet/logger'

const log: Log = new Log(LogComponent.SDET_RUNNER)

export function ReportingAPI() {
  // eslint-disable-next-line no-console
  log.info(
    `ReportingAPI process.env.RETURNLY_REPORTPORTAL_PARALLEL: ${process.env.RETURNLY_REPORTPORTAL_PARALLEL}`
  )
  return process.env.RETURNLY_REPORTPORTAL_PARALLEL === 'true'
    ? ParallelReportingAPI
    : PublicReportingAPI
}
