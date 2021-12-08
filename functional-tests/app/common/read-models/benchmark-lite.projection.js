import {
  LITE_READ_MODEL_TABLES_COUNT,
  EVENT_COUNTER_ROW_ID,
  getLiteReadModelTableName,
  makeProjection,
} from './benchmark-base'

const ROWS_PER_TABLE_COUNT = 10000
const getRowId = (index) => ~~Math.floor(index) % ROWS_PER_TABLE_COUNT
const liteBenchProjection = async (store, event) => {
  const eventCounterTableName = getLiteReadModelTableName(0)
  await store.update(
    eventCounterTableName,
    { id: EVENT_COUNTER_ROW_ID },
    { $inc: { document: 1 } }
  )

  const tableName = getLiteReadModelTableName(event.timestamp)
  const rowId = `${getRowId(event.aggregateId)}`
  await store.update(
    tableName,
    { id: rowId },
    { $set: { id: rowId, part: rowId, document: event } },
    { upsert: true }
  )
}

const liteProjection = makeProjection(
  LITE_READ_MODEL_TABLES_COUNT,
  getLiteReadModelTableName,
  liteBenchProjection
)

export default liteProjection
