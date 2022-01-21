import { performance } from 'perf_hooks'
import type {
  Adapter,
  StoredEventBatchPointer,
  EventFilter,
} from '@resolve-js/eventstore-base'
import { createAdapter } from './utils'

import minimist from 'minimist'

type CursorLessEventFilter = Omit<EventFilter, 'cursor'>

async function measureLoadAllEvents(
  adapter: Adapter,
  filter: CursorLessEventFilter,
  onBatch?: (batchSize: number, batchTime: number) => void
) {
  let loadResult: StoredEventBatchPointer = { cursor: null, events: [] }
  let totalDuration = 0
  let loadTimes = 0

  do {
    const startBatchTime = performance.now()
    loadResult = await adapter.loadEvents({
      cursor: loadResult.cursor,
      ...filter,
    })
    const batchTime = performance.now() - startBatchTime

    totalDuration += batchTime
    loadTimes++
    if (onBatch) {
      onBatch(loadResult.events.length, batchTime)
    }
  } while (loadResult.events.length > 0)

  return {
    total: totalDuration,
    average: loadTimes === 0 ? 0 : totalDuration / loadTimes,
  }
}

const eventFilter: CursorLessEventFilter = {
  limit: 1000,
}

const parsed = minimist(process.argv.slice(2))
if (parsed['help']) {
  console.log(`Usage: yarn benchmark:load-events [...options]
    --help
    --db=<name>                 Schema name in the database [required]
    --limit=<count>             Limit events per load step
    --eventTypes=<list,...>     Comma separated list of event types
    --aggregateIds=<list,...>   Comma separated list of aggregate ids`)
  process.exit(0)
}

const dbName = parsed['db']
if (typeof dbName !== 'string') {
  console.error('"db" parameter is required')
  process.exit(1)
}

if (parsed['limit']) {
  eventFilter.limit = +parsed['limit']
}
if (parsed['eventTypes']) {
  eventFilter.eventTypes = parsed['eventTypes'].split(',')
}
if (parsed['aggregateIds']) {
  eventFilter.aggregateIds = parsed['aggregateIds'].split(',')
}

console.log('Loading applying filter:', eventFilter)

void (async () => {
  const adapter = createAdapter(dbName)

  try {
    const description = await adapter.describe()
    console.log(
      `Running benchmark on event store of ${description.eventCount} events`
    )

    let loadedEventCount = 0
    const result = await measureLoadAllEvents(
      adapter,
      eventFilter,
      function (batchSize, batchTime) {
        loadedEventCount += batchSize
        console.log(
          `Total loaded at the moment: ${loadedEventCount}. Loaded ${batchSize} events in ${batchTime} ms`
        )
      }
    )
    console.log(`Total time: ${result.total} ms`)
    console.log(`Average time: ${result.average} ms`)
  } finally {
    await adapter.dispose()
  }
})()
