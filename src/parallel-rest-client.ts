const axios = require('axios')
const axiosRetry = require('axios-retry')
const http = require('http')
const https = require('https')
const PacProxyAgent = require('pac-proxy-agent')

const DEFAULT_MAX_CONNECTION_TIME_MS = 30000

axiosRetry(axios, {
  retryDelay: () => 100,
  retries: 10,
  retryCondition: axiosRetry.isRetryableError,
})

export class ParallelRestClient {
  private baseURL: any
  private headers: any
  private restClientConfig: any
  constructor(options) {
    this.baseURL = options.baseURL
    this.headers = options.headers
    this.restClientConfig = options.restClientConfig
  }

  buildPath(path) {
    return [this.baseURL, path].join('/')
  }

  buildPathToSyncAPI(path) {
    return [this.baseURL.replace('/v2', '/v1'), path].join('/')
  }

  static generateAgent(url: string) {
    const proxy = 'pac+https://app.strongdm.com/proxy.pac?all'

    // Bypass PacFile agent if:
    // - execution doesn't use SDM
    // - internal requests
    // - we set access Cookie

    return this.isPacNeeded(url) ? new PacProxyAgent(proxy) : undefined
  }
  static isPacNeeded(url: string) {
    if (process.env.BUILDKITE) return false
    return url.includes('.returnly.sdm.network')
  }

  static request(method, url, data, options = {}) {
    return axios({
      method,
      url,
      data,
      timeout: DEFAULT_MAX_CONNECTION_TIME_MS,
      ...options,
      httpsAgent: ParallelRestClient.generateAgent(url),
    })
      .then((response) => response.data)
      .catch((error) => {
        const errorMessage = error.message
        const responseData = error.response && error.response.data
        throw new Error(
          `${errorMessage}${
            responseData && typeof responseData === 'object'
              ? `: ${JSON.stringify(responseData)}`
              : ''
          }`
        )
      })
  }

  getRestConfig() {
    if (!this.restClientConfig) return {}

    const config = Object.keys(this.restClientConfig).reduce((acc, key) => {
      if (key !== 'agent') {
        acc[key] = this.restClientConfig[key]
      }
      return acc
    }, {})

    if ('agent' in this.restClientConfig) {
      const { protocol } = new URL(this.baseURL)
      const isHttps = /https:?/
      const isHttpsRequest = isHttps.test(protocol)
      config[isHttpsRequest ? 'httpsAgent' : 'httpAgent'] = isHttpsRequest
        ? new https.Agent(this.restClientConfig.agent)
        : new http.Agent(this.restClientConfig.agent)
    }

    return config
  }

  create(path, data, options = { headers: this.headers }) {
    return ParallelRestClient.request('POST', this.buildPath(path), data, {
      ...options,
      ...this.getRestConfig(),
    })
  }

  retrieve(path, options = { headers: this.headers }) {
    return ParallelRestClient.request(
      'GET',
      this.buildPath(path),
      {},
      { ...options, ...this.getRestConfig() }
    )
  }

  update(path, data, options = { headers: this.headers }) {
    return ParallelRestClient.request('PUT', this.buildPath(path), data, {
      ...options,
      ...this.getRestConfig(),
    })
  }

  delete(path, data, options = { headers: this.headers }) {
    return ParallelRestClient.request('DELETE', this.buildPath(path), data, {
      ...options,
      ...this.getRestConfig(),
    })
  }

  retrieveSyncAPI(path, options = { headers: this.headers }) {
    return ParallelRestClient.request(
      'GET',
      this.buildPathToSyncAPI(path),
      {},
      { ...options, ...this.getRestConfig() }
    )
  }
}
