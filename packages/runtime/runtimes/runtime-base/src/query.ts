import logScope from '@resolve-js/debug-levels'
import type { EventSubscriberModelNamePart, ViewModelInterop, ReadModelInterop, SagaInterop, ExecuteQueryPool, QueryExecutor, MiddlewareContext, UnknownReadModelConnector, UnknownReadModelConnection, UnionMethodToUnionArgsMethod } from './types'
import parseEventSubscriberParameters from './parse-event-subscriber-parameters'

const getLog = (scope: string) => logScope(`resolve:runtime:query:${scope}`)

const parseReadOptions = <A,B>(options: {
  modelOptions?: A,
    modelArgs?: B,
    resolverName?: A,
    resolverArgs?: B,
    aggregateIds?: A,
    aggregateArgs?: B,
}): [A, B] => {
  let result: [A, B] | undefined = undefined
  if(options.modelOptions != null && options.modelArgs != null) {
      result = [options.modelOptions, options.modelArgs]
  } else if(options.resolverName != null && options.aggregateArgs != null) {
      result = [options.resolverName, options.aggregateArgs]
  } else if(options.aggregateIds != null && options.aggregateArgs != null) {
      result = [options.aggregateIds, options.aggregateArgs]
    }

  if(Object.keys(options).length !== 2) {
    result = undefined
  } 

  if(result == null) {
    throw new Error('Wrong options for read invocation') 
  }

  return result
}


const viewModelReadImpl = async (
  interop: ViewModelInterop,
  { jwt, ...params }: { jwt?: string } & Record<string, any>
): Promise<any> => {
  const [originalAggregateIds, aggregateArgs] = parseReadOptions<Array<string> | string, any>(params)
  let aggregateIds: any = null // TODO any
  try {
    if (Array.isArray(originalAggregateIds)) {
      aggregateIds = [...originalAggregateIds]
    } else if (originalAggregateIds === '*') {
      aggregateIds = null
    } else {
      aggregateIds = originalAggregateIds.split(/,/)
    }
  } catch (error) {
    throw new Error(`The following arguments are required: aggregateIds`)
  }

  const resolver = await interop.acquireResolver(
    {
      aggregateIds,
      aggregateArgs,
    },
    {
      jwt,
    }
  )
  return await resolver()
}

const readModelReadImpl = async (
  interop: ReadModelInterop | SagaInterop,
  readModelConnectors: Record<string, UnknownReadModelConnector>,
  performanceTracer: any,
  monitoring: any,
  { jwt, ...params }: any,
  middlewareContext?: MiddlewareContext
): Promise<any> => {
  const readModelName = interop.name
  const log = getLog(`read:${readModelName}`)

  const [resolverName, resolverArgs] = parseReadOptions<string, Record<string, any>>(params)

  const segment = performanceTracer ? performanceTracer.getSegment() : null
  const subSegment = segment ? segment.addNewSubsegment('read') : null

  if (subSegment != null) {
    subSegment.addAnnotation('readModelName', readModelName)
    subSegment.addAnnotation('resolverName', resolverName)
    subSegment.addAnnotation('origin', 'resolve:query:read')
  }

  try {
    const resolver = await interop.acquireResolver(
      resolverName,
      resolverArgs,
      {
        jwt,
      },
      middlewareContext
    )
    log.debug(`invoking resolver`)
  
    let result = null
    let connector: UnknownReadModelConnector | null = null
    let connection: UnknownReadModelConnection | null = null
    try {
      const log = getLog(`wrapConnection:${readModelName}`)
      log.debug(`establishing connection`)
      connector = readModelConnectors[interop.connectorName]
      connection = await connector?.connect(readModelName)
      log.debug(`connection established`)

      result = await resolver(connection)
      log.verbose(result)
    } finally {
      log.debug(`disconnecting`)
      if(connector != null && connection != null) {
        const disconnect = connector.disconnect.bind(connector) as UnionMethodToUnionArgsMethod<typeof connector.disconnect>
        await disconnect(connection, readModelName)
      }
      log.debug(`disconnected`)
    }

    return result
  } finally {
    if (subSegment != null) {
      subSegment.close()
    }
  }
}

const throwNoEventSubcriberError = (name: string) => {
  const error = new Error(
    `Read/view model "${name}" does not exist`
  ) as any
  error.code = 422
  throw error
}

const readImpl = async (
  pool: ExecuteQueryPool,
  params: EventSubscriberModelNamePart & Record<string, any>,
  middlewareContext?: MiddlewareContext
) => {
  const [name, parameters] = parseEventSubscriberParameters(params)
  const { readModelsInterop, viewModelsInterop } = pool  
  if(readModelsInterop[name] != null) {
    return await readModelReadImpl(readModelsInterop[name], pool.readModelConnectors, pool.performanceTracer, pool.monitoring, parameters, middlewareContext)
  } else if(viewModelsInterop[name] != null) {
    return await viewModelReadImpl(viewModelsInterop[name], parameters)
  } else {
    throwNoEventSubcriberError(name)
  }
}

const serializeStateImpl = async (
  pool: ExecuteQueryPool,
  params: EventSubscriberModelNamePart & Record<string, any>,
) => {
  const [name, parameters] = parseEventSubscriberParameters(params)
  const { readModelsInterop, viewModelsInterop } = pool  
  if(readModelsInterop[name] != null) {
    return JSON.stringify(parameters.state, null, 2)
  } else if(viewModelsInterop[name] != null) {
    return viewModelsInterop[name].serialize(parameters.state, parameters.jwt)
  } else {
    throwNoEventSubcriberError(name)
  }
}

export const createQueryExecutor = (
  pool: ExecuteQueryPool
): QueryExecutor => {  
  const api = Object.freeze(Object.assign(readImpl.bind(null, pool), {
     read: readImpl.bind(null, pool),
     serializeState: serializeStateImpl.bind(null, pool),
     ...pool.eventSubscriber
  }))

  return api
}
