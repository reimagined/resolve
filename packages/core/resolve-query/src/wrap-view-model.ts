import getLog from './get-log'
import { WrapViewModelOptions } from './types'
import parseReadOptions from './parse-read-options'

type AggregateIds = string | string[]

type ViewModelMeta = {
  name: string
  invariantHash: string
  deserializeState: Function
  serializeState: Function
  projection: { [key: string]: Function }
  encryption: Function
}

type ViewModelPool = {
  viewModel: ViewModelMeta
  eventstoreAdapter: any
  getSecretsManager: Function
  performanceTracer: any
  isDisposed: boolean
}

const getKey = (aggregateIds: AggregateIds): string =>
  Array.isArray(aggregateIds) ? aggregateIds.sort().join(',') : aggregateIds

const read = async (
  pool: ViewModelPool,
  { jwt, ...params }: any
): Promise<any> => {
  const viewModelName = pool.viewModel.name
  const [modelOptions, aggregateArgs] = parseReadOptions(params)

  if (pool.isDisposed) {
    throw new Error(`View model "${viewModelName}" is disposed`)
  }
  let aggregateIds = null
  try {
    if (Array.isArray(modelOptions)) {
      aggregateIds = [...modelOptions]
    } else if (modelOptions === '*') {
      aggregateIds = '*'
    } else {
      aggregateIds = modelOptions.split(/,/)
    }
  } catch (error) {
    throw new Error(
      `View model "${viewModelName}" requires aggregates identifier list`
    )
  }
  const key = getKey(aggregateIds)

  const getLocalLog = (scope: string): any =>
    getLog(`buildViewModel:${viewModelName}${scope}`)
  const log = getLocalLog('')

  const snapshotKey = `VM;${pool.viewModel.invariantHash};${key}`
  log.verbose(`snapshotKey: ${snapshotKey}`)

  let aggregatesVersionsMap = new Map()
  let cursor: any = null
  let state: any = null

  try {
    log.debug(`loading latest snapshot`)
    const snapshotData = await pool.eventstoreAdapter.loadSnapshot(snapshotKey)
    log.verbose(`snapshot: ${snapshotData}`)
    const snapshot = JSON.parse(snapshotData)

    if (snapshot != null) {
      aggregatesVersionsMap = new Map(snapshot.aggregatesVersionsMap)
      log.debug(`deserialize snapshot state`)
      state = await pool.viewModel.deserializeState(snapshot.state)
      log.verbose(`snapshot state: ${state}`)
      cursor = snapshot.cursor
      log.verbose(`snapshot cursor: ${cursor}`)
    }
  } catch (error) {
    log.verbose(error.message)
  }

  if (cursor == null && typeof pool.viewModel.projection.Init === 'function') {
    log.debug(`initializing view model from scratch`)
    state = pool.viewModel.projection.Init()
  }

  log.debug(`retrieving event store secrets manager`)
  const secretsManager =
    typeof pool.getSecretsManager === 'function'
      ? await pool.getSecretsManager()
      : null

  const handler = async (event: any): Promise<any> => {
    const handlerLog = getLocalLog(`:handler:${event.type}`)
    handlerLog.debug(`executing`)

    try {
      handlerLog.debug(`building view-model encryption`)
      const encryption = await pool.viewModel.encryption(event, {
        secretsManager
      })

      handlerLog.debug(`applying event to projection`)
      state = await pool.viewModel.projection[event.type](
        state,
        event,
        aggregateArgs,
        {
          jwt,
          ...encryption
        }
      )
      cursor = await pool.eventstoreAdapter.getNextCursor(cursor, [event])

      aggregatesVersionsMap.set(event.aggregateId, event.aggregateVersion)

      handlerLog.debug(`saving the snapshot`)
      await pool.eventstoreAdapter.saveSnapshot(
        snapshotKey,
        JSON.stringify({
          aggregatesVersionsMap: Array.from(aggregatesVersionsMap),
          state: await pool.viewModel.serializeState(state),
          cursor
        })
      )
    } catch (error) {
      log.error(error.message)
      throw error
    }
  }

  const { events } = await pool.eventstoreAdapter.loadEvents({
    aggregateIds: aggregateIds !== '*' ? aggregateIds : null,
    eventTypes: Object.keys(pool.viewModel.projection),
    cursor,
    limit: Number.MAX_SAFE_INTEGER
  })

  log.debug(`fetched ${events.length} events for the view model, applying`)

  for (const event of events) {
    await handler(event)
  }

  return state
}

const readAndSerialize = async (
  pool: ViewModelPool,
  { jwt, ...params }: any
): Promise<any> => {
  const viewModelName = pool.viewModel.name

  if (pool.isDisposed) {
    throw new Error(`View model "${viewModelName}" is disposed`)
  }
  const state = await read(pool, { jwt, ...params })

  return await pool.viewModel.serializeState(state, jwt)
}

const sendEvents = async (pool: ViewModelPool): Promise<any> => {
  const viewModelName = pool.viewModel.name

  if (pool.isDisposed) {
    throw new Error(`View model "${viewModelName}" is disposed`)
  }

  throw new Error(`View model "${viewModelName}" cannot be updated by events`)
}

const drop = async (pool: ViewModelPool): Promise<any> => {
  const viewModelName = pool.viewModel.name

  if (pool.isDisposed) {
    throw new Error(`View model "${viewModelName}" is disposed`)
  }

  throw new Error(
    `Snapshot cleaning for view-model "${viewModelName}" is not implemented`
  )
}

const dispose = async (pool: ViewModelPool): Promise<any> => {
  const viewModelName = pool.viewModel.name

  if (pool.isDisposed) {
    throw new Error(`View model "${viewModelName}" is disposed`)
  }
  pool.isDisposed = true
}

const wrapViewModel = ({
  viewModel,
  eventstoreAdapter,
  performanceTracer
}: WrapViewModelOptions) => {
  const getSecretsManager = eventstoreAdapter.getSecretsManager.bind(null)
  const pool = {
    viewModel,
    eventstoreAdapter,
    isDisposed: false,
    performanceTracer,
    getSecretsManager
  }

  return Object.freeze({
    read: read.bind(null, pool),
    readAndSerialize: readAndSerialize.bind(null, pool),
    sendEvents: sendEvents.bind(null, pool),
    drop: drop.bind(null, pool),
    dispose: dispose.bind(null, pool)
  })
}

export default wrapViewModel
