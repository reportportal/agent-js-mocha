export interface LoggerEvent {
  testObjectData: TestObjectData
  timeStamp: number
  event: string
  log: any
}

export interface TestObjectData {
  test: string
  suite: string | undefined
}
