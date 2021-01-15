import { Monitoring } from '../types'

export type AggregateCommandContext = {
  jwt?: string
}

export type AggregateRuntime = {
  monitoring: Monitoring
}

export type AggregateInterop = {
  name: string
}

export type AggregateInteropMap = {
  [key: string]: AggregateInterop
}

export type AggregatesInteropBuilder = (
  runtime: AggregateRuntime
) => AggregateInteropMap

// FIXME: replace create with get?
export type AggregateDomain = {
  acquireAggregatesInterop: AggregatesInteropBuilder
}
