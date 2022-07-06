import { deepcopy } from '@rtly-sdet/utils'

export const getDefaultOptions = () =>
  deepcopy({
    reporter: '@reportportal/agent-js-mocha',
    parallel: true,
    reporterOptions: {
      token: '00000000-0000-0000-0000-000000000000',
      endpoint: 'https://reportportal.server/api/v1',
      project: 'ProjectName',
      launch: 'LauncherName',
      description: 'Launch description',
      attributes: [],
      dontLaunchServer: true,
    },
  })

export const mockedDate = Date.now()
