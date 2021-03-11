import { symbol, Phases } from './constants'
import { EventHandlerEncryptionFactory } from '@resolve-js/core'
export interface ReadModelParams {
  name: string
  projection: any
  resolvers: any
  adapter: any
  encryption?: EventHandlerEncryptionFactory
}

const readModel = (
  {
    promise,
  }: {
    promise: any
  },
  { name, projection, resolvers, adapter, encryption }: ReadModelParams
): any => {
  if (promise[symbol].phase !== Phases.GIVEN_EVENTS) {
    throw new TypeError()
  }
  promise[symbol].name = name
  promise[symbol].projection = projection != null ? projection : {}
  promise[symbol].resolvers = resolvers != null ? resolvers : {}
  promise[symbol].adapter = adapter
  promise[symbol].encryption = encryption

  for (const resolverName of Object.keys(promise[symbol].resolvers)) {
    promise[resolverName] = (resolverArgs: any) => {
      promise[symbol].resolverArgs = resolverArgs
      promise[symbol].resolverName = resolverName

      promise[symbol].phase = Phases.RESOLVER

      return promise
    }
  }

  promise[symbol].phase = Phases.READ_MODEL

  return promise
}

export default readModel
