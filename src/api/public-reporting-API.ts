import { OptionsSource } from '../options-source'
import { ParallelReportingAPI } from './parallel-reporting-API'
const PublicReportingAPI = require('@reportportal/agent-js-mocha/lib/publicReportingAPI')

export function ReportingAPI() {
  return OptionsSource.getOptions().parallel
    ? ParallelReportingAPI
    : PublicReportingAPI
}
