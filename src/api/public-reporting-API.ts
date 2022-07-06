const ParallelReportingAPI = require('./parallel-reporting-API')
const PublicReportingAPI = require('@reportportal/agent-js-mocha/lib/publicReportingAPI')

export function ReportingAPI() {
  // eslint-disable-next-line no-console
  console.log(
    'ReportingAPI process.env.RETURNLY_REPORTPORTAL_PARALLEL: ',
    process.env.RETURNLY_REPORTPORTAL_PARALLEL
  )
  return process.env.RETURNLY_REPORTPORTAL_PARALLEL === 'true'
    ? ParallelReportingAPI
    : PublicReportingAPI
}
