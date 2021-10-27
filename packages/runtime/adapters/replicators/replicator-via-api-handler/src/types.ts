import type {
  CommonAdapterPool,
  CommonAdapterOptions,
  AdapterOperations,
  AdapterConnection,
  AdapterImplementation,
  StoreApi,
  OmitObject,
} from '@resolve-js/readmodel-base'
import {
  ReplicationState,
  OldEvent,
  OldSecretRecord,
} from '@resolve-js/eventstore-base'

export * from '@resolve-js/readmodel-base'

export type DropReadModelMethod = (
  pool: AdapterPool,
  readModelName: string
) => Promise<void>

export type GetReplicationState = (
  pool: AdapterPool
) => Promise<ReplicationState>

export type CallReplicateResult = {
  type: 'launched' | 'unknown' | 'serverError' | 'clientError'
  httpStatus: number
  message: string
}

export type CallReplicate = (
  pool: AdapterPool,
  events: OldEvent[],
  secretsToSet: OldSecretRecord[],
  secretsToDelete: Array<OldSecretRecord['id']>,
  iterator: ReplicationState['iterator']
) => Promise<CallReplicateResult>

export type SetReplicationPaused = (
  pool: AdapterPool,
  paused: boolean
) => Promise<void>

export type AdapterOptions = CommonAdapterOptions & {
  targetApplicationUrl: string
  preferRegularLoader?: boolean
}

export type InternalMethods = {
  dropReadModel: DropReadModelMethod
  getReplicationState: GetReplicationState
  callReplicate: CallReplicate
  setReplicationPaused: SetReplicationPaused
  occupyReplication: (
    pool: AdapterPool,
    duration: number
  ) => Promise<{ success: boolean; message?: string }>
  releaseReplication: (pool: AdapterPool) => Promise<void>
}

export type ArrayOrSingleOrNull<T> = Array<T> | T | null

export type AdapterPool = CommonAdapterPool & {
  targetApplicationUrl: string
  preferRegularLoader: boolean
} & {
    [K in keyof AdapterOperations<CommonAdapterPool>]: AdapterOperations<AdapterPool>[K]
  } &
  {
    [K in keyof StoreApi<CommonAdapterPool>]: StoreApi<AdapterPool>[K]
  } &
  InternalMethods

export type CurrentAdapterConnection = AdapterConnection<
  AdapterPool,
  OmitObject<AdapterOptions, CommonAdapterPool>
>

export type ExternalMethods = {
  [K in keyof AdapterOperations<CommonAdapterPool>]: AdapterPool[K]
}

export type CurrentStoreApi = {
  [K in keyof StoreApi<CommonAdapterPool>]: AdapterPool[K]
}

export type ConnectionDependencies = InternalMethods &
  ExternalMethods &
  CurrentStoreApi

export type CurrentConnectMethod = (
  imports: ConnectionDependencies,
  ...args: Parameters<CurrentAdapterConnection['connect']>
) => ReturnType<CurrentAdapterConnection['connect']>

export type CurrentDisconnectMethod = CurrentAdapterConnection['disconnect']

export type CurrentAdapterImplementation = AdapterImplementation<
  AdapterPool,
  AdapterOptions
>
