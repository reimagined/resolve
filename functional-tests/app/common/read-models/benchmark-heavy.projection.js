import {
  HEAVY_READ_MODEL_TABLES_COUNT,
  EVENT_COUNTER_ROW_ID,
  getHeavyReadModelTableName,
  makeProjection,
} from './benchmark-base'

// https://en.wikipedia.org/wiki/Barab%C3%A1si%E2%80%93Albert_model
const heavyBenchProjection = async (store, event) => {
  const eventCounterTableName = getHeavyReadModelTableName(0)
  await store.update(
    eventCounterTableName,
    { id: EVENT_COUNTER_ROW_ID },
    { $inc: { document: 1 } }
  )

  const inputTableName = getHeavyReadModelTableName(event.timestamp)
  const rowId = `${event.aggregateId}`
  const partId = rowId.substr(0, 3)

  const tablesForUpdate = new Set()
  for (let index = 0; index < HEAVY_READ_MODEL_TABLES_COUNT; index++) {
    const currentTableName = getHeavyReadModelTableName(index)
    if ((await store.count(currentTableName, { part: partId })) > 0) {
      tablesForUpdate.add(currentTableName)
    }
  }
  if (tablesForUpdate.size === 0) {
    tablesForUpdate.add(inputTableName)
  }

  for (const tableName of tablesForUpdate) {
    await store.update(
      tableName,
      { id: rowId },
      { $set: { id: rowId, part: partId, document: event } },
      { upsert: true }
    )
  }
}

const heavyProjection = makeProjection(
  HEAVY_READ_MODEL_TABLES_COUNT,
  getHeavyReadModelTableName,
  heavyBenchProjection
)

export default heavyProjection
