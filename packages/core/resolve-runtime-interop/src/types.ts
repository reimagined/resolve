import {
  Aggregate,
  AggregateEncryptionFactory,
  AggregateProjection,
} from 'resolve-core'

export type AggregateMeta = {
  name: string
  commands: Aggregate
  projection: AggregateProjection
  serializeState: Function
  deserializeState: Function
  encryption: AggregateEncryptionFactory | null
  invariantHash?: string
}
