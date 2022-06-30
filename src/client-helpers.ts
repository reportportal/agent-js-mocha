const fs = require('fs')
const os = require('os')
const RestClient = require('@reportportal/client-javascript/lib/rest')

const MIN = 3
const MAX = 256

export class ClientHelpers {
  public getUUIDFromFileName(filename) {
    filename.match(/rplaunch-(.*)\.tmp/)[1]
  }

  public formatName(name) {
    const len = name.length
    // eslint-disable-next-line no-mixed-operators
    return (len < MIN ? name + new Array(MIN - len + 1).join('.') : name).slice(
      -MAX
    )
  }

  public now() {
    return new Date().valueOf()
  }

  public getServerResult(url, request, options, method) {
    return RestClient.request(method, url, request, options)
  }

  public saveLaunchIdToFile(launchId) {
    const filename = `rplaunch-${launchId}.tmp`
    fs.open(filename, 'w', (err) => {
      if (err) {
        throw err
      }
    })
  }

  public getSystemAttribute() {
    const osType = os.type()
    const osArchitecture = os.arch()
    const RAMSize = os.totalmem()
    const nodeVersion = process.version
    return [
      {
        key: 'os',
        value: `${osType}|${osArchitecture}`,
        system: true,
      },
      {
        key: 'RAMSize',
        value: RAMSize,
        system: true,
      },
      {
        key: 'nodeJS',
        value: nodeVersion,
        system: true,
      },
    ]
  }

  public generateTestCaseId(codeRef: any, params: any) {
    if (!codeRef) {
      return
    }
    if (!params) {
      return codeRef
    }
    const parameters = params.reduce(
      (result, item) => (item.value ? result.concat(item.value) : result),
      []
    )

    return `${codeRef}[${parameters}]`
  }
}
