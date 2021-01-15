import {
  AggregatesInteropBuilder,
  AggregateInteropMap,
  AggregateInterop,
  AggregateRuntime,
} from './types'
import { AggregateMeta } from '../types'
import getLog from '../get-log'

/*
const monitoredError = async (
  runtime: ReadModelRuntime,
  error: Error,
  meta: any
) => {
  await runtime.monitoring?.error?.(error, 'readModelResolver', meta)
  return error
}
*/

const getAggregateInterop = (
  aggregate: AggregateMeta,
  runtime: AggregateRuntime
): AggregateInterop => {
  const { name } = aggregate
  //  const { monitoring } = runtime

  return {
    name,
  }
}

export const getAggregatesInteropBuilder = (
  aggregates: AggregateMeta[]
): AggregatesInteropBuilder => (runtime) =>
  aggregates.reduce<AggregateInteropMap>((map, model) => {
    map[model.name] = getAggregateInterop(model, runtime)
    return map
  }, {})
