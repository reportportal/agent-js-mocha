import { PrParallelRunClient } from './pr-parallel-run-client'

export class LaunchData {
  private rpClient: PrParallelRunClient

  constructor(rpClient: PrParallelRunClient) {
    this.rpClient = rpClient
  }
}
