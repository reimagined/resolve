import { ViewModelInterop } from '@resolve-js/core'

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
  performanceTracer,
}: WrapViewModelOptions) => {
  const pool: ViewModelPool = {
    isDisposed: false,
    performanceTracer,
  }

  return Object.freeze({
    read: read.bind(null, pool, interop),
    serializeState: serializeState.bind(null, interop),
    dispose: dispose.bind(null, pool, interop),
  })
}

export default wrapViewModel
