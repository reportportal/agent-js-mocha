import { OptionsSource } from '../options-source'
import { ParallelReportingAPI } from './parallel-reporting-API'
const PublicReportingAPI = require('@reportportal/agent-js-mocha/lib/publicReportingAPI')

export function ReportingAPI() {
  const options = OptionsSource.getOptions()
  if (options.parallel === true) return new ParallelReportingAPI()
  return PublicReportingAPI
}
