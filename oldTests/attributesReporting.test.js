const EventEmitter = require('events')
const { getDefaultConfig, RPClient } = require('./mocks')
const ReportportalParallelRunAgent = require('./../src/reportportal-parallel-run-agent')

describe('attributes reporting', function () {
  let reporter
  beforeAll(function () {
    const options = getDefaultConfig()
    const runner = new EventEmitter()
    reporter = new ReportportalParallelRunAgent(runner, options)
    reporter.rpClient = new RPClient(options)
    reporter.suitesStackTempId = ['tempRootSuiteId', 'tempSuiteId']
  })

  afterEach(function () {
    reporter.currentTest = null
    reporter.attributes.clear()
    jest.clearAllMocks()
  })

  it('onAddAttributes: should add attributes for current test in attributes map', function () {
    reporter.currentTest = {
      title: 'test',
      tempId: 'testItemId',
    }
    const attributes = [
      {
        key: 'key1',
        value: 'value1',
      },
    ]
    const expectedAttributes = new Map([['testItemId', attributes]])

    reporter.onAddAttributes({ attributes })

    expect(reporter.attributes).toEqual(expectedAttributes)
  })

  it('onAddAttributes: should append attributes for current test in attributes map', function () {
    reporter.currentTest = {
      title: 'test',
      tempId: 'testItemId',
    }
    reporter.attributes.set('testItemId', [
      {
        key: 'key1',
        value: 'value1',
      },
    ])
    const attributes = [
      {
        key: 'key2',
        value: 'value2',
      },
      {
        key: 'key3',
        value: 'value3',
      },
    ]

    const expectedAttributesMap = new Map([
      [
        'testItemId',
        [
          {
            key: 'key1',
            value: 'value1',
          },
          {
            key: 'key2',
            value: 'value2',
          },
          {
            key: 'key3',
            value: 'value3',
          },
        ],
      ],
    ])

    reporter.onAddAttributes({ attributes })

    expect(reporter.attributes).toEqual(expectedAttributesMap)
  })

  it('onAddAttributes: should add attributes for current suite in attributes map', function () {
    const attributes = [
      {
        key: 'key1',
        value: 'value1',
      },
      {
        key: 'key2',
        value: 'value2',
      },
    ]

    const expectedAttributesMap = new Map([
      [
        'tempSuiteId',
        [
          {
            key: 'key1',
            value: 'value1',
          },
          {
            key: 'key2',
            value: 'value2',
          },
        ],
      ],
    ])

    reporter.onAddAttributes({ attributes })

    expect(reporter.attributes).toEqual(expectedAttributesMap)
  })

  it('onAddAttributes without attributes: should not add attributes for current suite in attributes map', function () {
    const expectedAttributesMap = new Map()

    reporter.onAddAttributes({})

    expect(reporter.attributes).toEqual(expectedAttributesMap)
  })
})
