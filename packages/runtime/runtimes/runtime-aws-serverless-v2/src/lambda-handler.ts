import { LambdaContext, LambdaEvent, RuntimeOptions } from './types'
import { getLog, RuntimeEntryContext } from '@resolve-js/runtime-base'
import { createContext } from './create-context'

const log = getLog('lambda-handler')

export const lambdaHandler = async (
  runtimeOptions: RuntimeOptions,
  runtimeEntryContext: RuntimeEntryContext,
  lambdaEvent: LambdaEvent,
  lambdaContext: LambdaContext
): Promise<any> => {
  lambdaContext.callbackWaitsForEmptyEventLoop = false

  log.debug('executing application lambda')
  log.verbose(JSON.stringify(lambdaEvent, null, 2))

  const context = createContext(
    runtimeOptions,
    runtimeEntryContext,
    lambdaEvent,
    lambdaContext
  )

  console.log(context.deploymentId)

  // if(isHttpRequest)

  return null
}
