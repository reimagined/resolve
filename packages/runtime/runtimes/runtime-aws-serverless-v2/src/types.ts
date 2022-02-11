export type RuntimeOptions = {}

export type LambdaEvent = any

export type LambdaContext = {
  callbackWaitsForEmptyEventLoop: boolean
  invokedFunctionArn: string
  functionName: string
  getRemainingTimeInMillis: () => number
}
