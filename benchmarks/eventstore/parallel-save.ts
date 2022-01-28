import type {
  Adapter,
  InputEvent,
  StoredEventPointer,
  EventFilter,
} from '@resolve-js/eventstore-base'
import { performance } from 'perf_hooks'
import minimist from 'minimist'
import { createAdapter, createEventstore, clearEventstore } from './utils'

function parallelAggregateId(i: number) {
  return `PARALLEL_AGGREGATE_${i}`
}

const parsed = minimist(process.argv.slice(2))

const dbName = parsed['db']
if (typeof dbName !== 'string') {
  console.error('"db" parameter is required')
  process.exit(1)
}

const shouldCreate = parsed['create'] === 'true'
const shouldClear = parsed['clear'] === 'true'

const saveParallelFactor = parsed['saveParallel'] ?? 10
const loadParallelFactor = parsed['loadParallel'] ?? 1
const stepCount = parsed['stepCount'] ?? 100
const payloadSize = parsed['payloadSize'] ?? 150
const loadLimit = parsed['loadLimit'] ?? 100

if (typeof saveParallelFactor !== 'number' || saveParallelFactor < 1) {
  console.error(
    'Invalid parallel factor: save parallel factor must be at least 1'
  )
  process.exit(1)
}

if (typeof loadParallelFactor !== 'number' || loadParallelFactor < 0) {
  console.error(
    `Invalid parallel factor: load parallel factor must be a positive non-zero number`
  )
  process.exit(1)
}

void (async () => {
  if (shouldCreate) {
    console.log(`Creating a new event store "${dbName}"`)
    await createEventstore(dbName)
  }

  if (shouldClear) {
    console.log(`Clearing the eventstore "${dbName}"`)
    await clearEventstore(dbName)
  }

  const saveAdapters: Adapter[] = []
  const loadAdapters: Adapter[] = []

  for (let i = 0; i < saveParallelFactor; ++i) {
    saveAdapters.push(createAdapter(dbName))
    saveAdapters[i].establishTimeLimit(() => 25000)
  }
  for (let i = 0; i < loadParallelFactor; ++i) {
    loadAdapters.push(createAdapter(dbName))
  }

  const adapter = createAdapter(dbName)

  try {
    const description = await adapter.describe()
    console.log('Event count before benchmark: ', description.eventCount)
    console.log('Number of sequential steps: ', stepCount)
    console.log(
      'Number of parallel save operations in one step: ',
      saveParallelFactor
    )
    console.log(
      'Number of parallel load operations in one step: ',
      loadParallelFactor
    )

    const payloadData = '#'.repeat(payloadSize)

    const aggregateMap: Map<string, number> = new Map()

    for (let i = 0; i < saveParallelFactor; ++i) {
      const aggregateId = parallelAggregateId(i)
      const latestEvent = await adapter.getLatestEvent({
        aggregateIds: [aggregateId],
      })
      if (latestEvent) {
        aggregateMap.set(latestEvent.aggregateId, latestEvent.aggregateVersion)
      }
    }

    let totalDuration = 0

    for (let i = 0; i < stepCount; ++i) {
      const eventBatch: Array<InputEvent> = []
      for (let j = 0; j < saveParallelFactor; ++j) {
        const aggregateId = parallelAggregateId(j)
        const aggregateVersion = aggregateMap.has(aggregateId)
          ? aggregateMap.get(aggregateId) + 1
          : 1

        eventBatch.push({
          aggregateId: parallelAggregateId(j),
          aggregateVersion: aggregateVersion,
          type: 'EVENT_TYPE',
          payload: { data: payloadData },
          timestamp: 1,
        })
      }

      const loadFilters: EventFilter[] = []

      for (let j = 0; j < loadParallelFactor; ++j) {
        const aggregateIdToLoadBy = parallelAggregateId(
          Math.floor(Math.random() * saveParallelFactor)
        )

        loadFilters.push({
          limit: loadLimit,
          cursor: null,
          aggregateIds: [aggregateIdToLoadBy],
        })
      }

      const startBatchTime = performance.now()
      const savePromises = eventBatch.map((event, index) =>
        saveAdapters[index].saveEvent(event)
      )
      const loadPromises = loadFilters.map((eventFilter, index) =>
        loadAdapters[index].loadEvents(eventFilter)
      )
      await Promise.all([Promise.all(loadPromises), Promise.all(savePromises)])
      const batchTime = performance.now() - startBatchTime

      for (const event of eventBatch) {
        aggregateMap.set(event.aggregateId, event.aggregateVersion)
      }

      totalDuration += batchTime
      console.log(
        `Saved ${saveParallelFactor} events in parallel ${
          loadParallelFactor > 0 ? '(while loading events)' : ''
        } in ${batchTime} ms`
      )
    }

    console.log(`Average per event batch: ${totalDuration / stepCount} ms`)
  } finally {
    await adapter.dispose()
    await Promise.all(saveAdapters.map((saveAdapter) => saveAdapter.dispose()))
    await Promise.all(loadAdapters.map((loadAdapter) => loadAdapter.dispose()))
  }
})()
