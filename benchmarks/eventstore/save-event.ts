import type {
  Adapter,
  InputEvent,
  StoredEventPointer,
} from '@resolve-js/eventstore-base'
import { performance } from 'perf_hooks'
import minimist from 'minimist'
import { createAdapter, createEventstore } from './utils'
import fs from 'fs'

type EventSpecification = {
  type?: string
  aggregateId?: string
  payloadSize?: number
  weight: number
}

type EventSetSpecification = {
  auto: {
    typeCount: number
    aggregateCount: number
    payloadSize?: number
    weight: number
  }
  extraEventSpecifications?: EventSpecification[]
  eventCount: number
  epochCount?: number
}

function autoAggregateId(i: number) {
  return `AUTO_AGGREGATE_${i}}`
}

async function measureSaveEvent(
  adapter: Adapter,
  specification: EventSetSpecification,
  onSave?: (event: StoredEventPointer, saveTime: number) => void
) {
  let eventSpecifications: EventSpecification[] = [
    {
      weight: specification.auto.weight,
      payloadSize: specification.auto.payloadSize,
    },
  ]
  if (specification.extraEventSpecifications) {
    eventSpecifications = eventSpecifications.concat(
      specification.extraEventSpecifications
    )
  }

  const weightSum = eventSpecifications.reduce((a, b) => a + b.weight, 0)

  const aggregateMap: Map<string, number> = new Map()

  for (let i = 0; i < specification.auto.aggregateCount; ++i) {
    const aggregateId = autoAggregateId(i)
    const latestEvent = await adapter.getLatestEvent({
      aggregateIds: [aggregateId],
    })
    if (latestEvent) {
      aggregateMap.set(latestEvent.aggregateId, latestEvent.aggregateVersion)
    }
  }

  if (specification.extraEventSpecifications) {
    for (const eventSpec of specification.extraEventSpecifications) {
      if (eventSpec.aggregateId) {
        const latestEvent = await adapter.getLatestEvent({
          aggregateIds: [eventSpec.aggregateId],
        })
        if (latestEvent) {
          aggregateMap.set(
            latestEvent.aggregateId,
            latestEvent.aggregateVersion
          )
        }
      }
    }
  }

  let currentTime = Date.now()
  let totalDuration = 0

  for (let i = 0; i < specification.eventCount; ++i) {
    const weightValue = Math.random() * weightSum
    let weightRange = 0
    let definition: EventSpecification =
      eventSpecifications[eventSpecifications.length - 1]
    for (let j = 0; j < eventSpecifications.length; ++j) {
      weightRange += eventSpecifications[j].weight
      if (weightValue < weightRange) {
        definition = eventSpecifications[j]
        break
      }
    }

    const eventType =
      definition.type ??
      `AUTO_TYPE_${Math.floor(Math.random() * specification.auto.typeCount)}`

    const aggregateId =
      definition.aggregateId ??
      autoAggregateId(
        Math.floor(Math.random() * specification.auto.aggregateCount)
      )

    const payload = {
      data: '#'.repeat(definition.payloadSize ?? 0),
    }

    const aggregateVersion = aggregateMap.has(aggregateId)
      ? aggregateMap.get(aggregateId) + 1
      : 1

    const event: InputEvent = {
      timestamp: currentTime++,
      type: eventType,
      aggregateId: aggregateId,
      aggregateVersion: aggregateVersion,
      payload: payload,
    }
    const startSaveTime = performance.now()
    const saveResult = await adapter.saveEvent(event)
    const saveTime = performance.now() - startSaveTime

    aggregateMap.set(aggregateId, aggregateVersion)

    totalDuration += saveTime
    if (onSave) {
      onSave(saveResult, saveTime)
    }
  }

  return {
    total: totalDuration,
    average:
      specification.eventCount === 0
        ? 0
        : totalDuration / specification.eventCount,
  }
}

const parsed = minimist(process.argv.slice(2))

if (parsed['help']) {
  console.log(`Usage: yarn benchmark:save-event [...options]
    --help
    --db=<name>       Schema name in the database [required]
    --clear=true      Clear events table before running the benchmark
    --create=true     Create a new eventstore
    --spec=<path>     Path to the spec JSON file describing the distribution of events to save`)
  process.exit(0)
}

const dbName = parsed['db']
if (typeof dbName !== 'string') {
  console.error('"db" parameter is required')
  process.exit(1)
}

const specPath = parsed['spec']
if (typeof specPath !== 'string') {
  console.error('"spec" parameter is required')
  process.exit(1)
}

const spec: EventSetSpecification = JSON.parse(
  fs.readFileSync(specPath).toString()
)

let shouldCreate = parsed['create'] === 'true'
let shouldClear = parsed['clear'] === 'true'

type Epoch = {
  eventCount: number
  epochDuration: number
}

void (async () => {
  if (shouldCreate) {
    console.log(`Creating a new eventstore "${dbName}"`)
    await createEventstore(dbName)
  }

  const adapter = createAdapter(dbName)
  adapter.establishTimeLimit(() => 25000)
  try {
    if (shouldClear) {
      console.log(`Clearing the eventstore "${dbName}"`)
      await adapter.drop()
      await adapter.init()
    }

    const description = await adapter.describe()
    console.log('Event count before benchmark: ', description.eventCount)
    console.log('Saving new events using specification: ', spec)

    const eventCountToSave = spec.eventCount
    const epochCount = spec.epochCount ?? 0

    let totalSavedCount = 0
    const eventCountPerEpoch =
      epochCount > 0 ? Math.floor(eventCountToSave / epochCount) : 0
    const epochs = new Array<Epoch>(epochCount)
    for (let i = 0; i < epochCount; ++i) {
      epochs[i] = { eventCount: 0, epochDuration: 0 }
    }

    const result = await measureSaveEvent(
      adapter,
      spec,
      (saveResult: StoredEventPointer, saveTime: number) => {
        if (epochCount === 0) return

        const epochIndex = Math.min(
          Math.floor(totalSavedCount / eventCountPerEpoch),
          epochCount - 1
        )
        totalSavedCount++
        epochs[epochIndex].eventCount++
        epochs[epochIndex].epochDuration += saveTime
      }
    )

    for (let i = 0; i < epochCount; ++i) {
      const epoch = epochs[i]
      console.log(
        `Epoch ${i}: ${epoch.eventCount} events, total ${
          epoch.epochDuration
        } ms, average ${epoch.epochDuration / epoch.eventCount} ms`
      )
    }

    console.log(`Total time: ${result.total} ms`)
    console.log(`Average time: ${result.average} ms`)
  } finally {
    await adapter.dispose()
  }
})()
