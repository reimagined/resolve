import { IS_BUILT_IN, makeMonitoringSafe, ViewModelInterop } from 'resolve-core'

import { WrapViewModelOptions, ViewModelPool } from './types'
import parseReadOptions from './parse-read-options'

const read = async (
  pool: ViewModelPool,
  interop: ViewModelInterop,
  { jwt, ...params }: any
): Promise<any> => {
  const viewModelName = interop.name

  const [originalAggregateIds, aggregateArgs] = parseReadOptions(params)
  let aggregateIds = null
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

  if (pool.isDisposed) {
    throw new Error(`View model "${viewModelName}" is disposed`)
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

const serializeState = async (
  { serialize }: ViewModelInterop,
  { state, jwt }: any
): Promise<any> => serialize(state, jwt)

const sendEvents = async (
  pool: ViewModelPool,
  interop: ViewModelInterop
): Promise<any> => {
  const viewModelName = interop.name

  if (pool.isDisposed) {
    throw new Error(`View model "${viewModelName}" is disposed`)
  }

  throw new Error(`View model "${viewModelName}" cannot be updated by events`)
}

const drop = async (
  pool: ViewModelPool,
  interop: ViewModelInterop
): Promise<any> => {
  const viewModelName = interop.name

  if (pool.isDisposed) {
    throw new Error(`View model "${viewModelName}" is disposed`)
  }

  throw new Error(
    `Snapshot cleaning for view-model "${viewModelName}" is not implemented`
  )
}

const dispose = async (
  pool: ViewModelPool,
  interop: ViewModelInterop
): Promise<any> => {
  const viewModelName = interop.name

  if (pool.isDisposed) {
    throw new Error(`View model "${viewModelName}" is disposed`)
  }
  pool.isDisposed = true
}

const wrapViewModel = ({
  interop,
  eventstoreAdapter,
  performanceTracer,
  monitoring,
}: WrapViewModelOptions) => {
  const getSecretsManager = eventstoreAdapter.getSecretsManager.bind(null)
  const pool: ViewModelPool = {
    eventstoreAdapter,
    isDisposed: false,
    performanceTracer,
    getSecretsManager,
    monitoring:
      monitoring != null ? makeMonitoringSafe(monitoring) : monitoring,
  }

  return Object.freeze({
    read: read.bind(null, pool, interop),
    sendEvents: sendEvents.bind(null, pool, interop),
    serializeState: serializeState.bind(null, interop),
    drop: drop.bind(null, pool, interop),
    dispose: dispose.bind(null, pool, interop),
  })
}

export default wrapViewModel
