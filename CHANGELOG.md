### Changed
- **Breaking change** Drop support of Node.js 10. The version [5.0.4](https://github.com/reportportal/agent-js-mocha/releases/tag/v5.0.4) is the latest that supports it.
- `@reportportal/client-javascript` bumped to version `5.1.4`, new `launchUuidPrintOutput` types introduced: 'FILE', 'ENVIRONMENT'.
- `mocha` bumped to version `10.6.0`.
### Security
- Updated versions of vulnerable packages (braces).
### Deprecated
- Node.js 12 usage. This minor version is the latest that supports Node.js 12.

## [5.0.4] - 2024-01-19
### Deprecated
- Node.js 10 usage. This version is the latest that supports Node.js 10.
### Changed
- `@reportportal/client-javascript` bumped to version `5.0.15`.

## [5.0.3] - 2023-07-18
### Changed
- `token` configuration option was renamed to `apiKey` to maintain common convention.
- `@reportportal/client-javascript` bumped to version `5.0.12`.

## [5.0.2] - 2022-12-12
### Fixed
- `skippedIssue` config property processing using .mocharc or string values
- Skipped test duplication
- Config attributes parsing using .mocharc
### Security
- Versions of several vulnerable dependencies updated
### Added
- `mode` option for submitting results to Debug tab
- Latest error log to the step description
### Changed
- Package size reduced

## [5.0.1] - 2020-06-23
### Added
- Added link to the example in readme.

## [5.0.0] - 2020-06-22
### Added
- Full compatibility with ReportPortal version 5.* (see [reportportal releases](https://github.com/reportportal/reportportal/releases))
- API to extend the functionality of the reporter (see [Additional reporting functionality](https://github.com/reportportal/agent-js-mocha#additional-reporting-functionality))
### Deprecated
- Previous package version [rp-mocha-reporter](https://www.npmjs.com/package/rp-mocha-reporter) will no longer supported by reportportal.io
