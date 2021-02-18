import { AggregateDomain } from './types'
import { getAggregatesInteropBuilder } from './get-aggregates-interop-builder'
import { validateAggregate } from './validate-aggregate'
import { AggregateMeta } from '../types/runtime'

export const initAggregateDomain = (
  rawAggregates: AggregateMeta[]
): AggregateDomain => {
  if (rawAggregates == null) {
    throw Error(`invalid aggregate meta`)
  }

  const meta = rawAggregates.map(validateAggregate)

  return {
    acquireAggregatesInterop: getAggregatesInteropBuilder(meta),
  }
}
