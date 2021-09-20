import { ViewModelInterop } from '@resolve-js/core'

import { WrapViewModelOptions, ViewModelPool, WrappedViewModel } from './types'
import parseReadOptions from './parse-read-options'

const read = async (
  pool: ViewModelPool,
  interop: ViewModelInterop,
  { jwt, ...params }: { jwt?: string } & Record<string, any>
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
  { state, jwt }: { state: any; jwt?: string }
): Promise<string> => serialize(state, jwt)

const dispose = async (
  pool: ViewModelPool,
  interop: ViewModelInterop
): Promise<void> => {
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

  const result: WrappedViewModel = {
    read: read.bind(null, pool, interop),
    serializeState: serializeState.bind(null, interop),
    dispose: dispose.bind(null, pool, interop),
  }
  return Object.freeze(result)
}

export default wrapViewModel
