export const EVENT_COUNTER_ROW_ID = 'EVENT-COUNTER-ROW-ID'
export const HEAVY_READ_MODEL_TABLES_COUNT = 10
export const LITE_READ_MODEL_TABLES_COUNT = 10
export const getReadModelTableName = (prefix, count, index) =>
  `${prefix}${Math.floor(index) % count}`
export const getHeavyReadModelTableName = getReadModelTableName.bind(
  null,
  'HeavyReadModelTable',
  HEAVY_READ_MODEL_TABLES_COUNT
)
export const getLiteReadModelTableName = getReadModelTableName.bind(
  null,
  'LiteReadModelTable',
  LITE_READ_MODEL_TABLES_COUNT
)

export const makeProjection = (tableCount, getTableName, benchProjection) => ({
  async Init(store) {
    for (let index = 0; index < tableCount; index++) {
      await store.defineTable(getTableName(index), {
        indexes: { id: 'string', part: 'string' },
        fields: ['document'],
      })
    }
    const eventCounterTableName = getTableName(0)
    await store.insert(eventCounterTableName, {
      id: EVENT_COUNTER_ROW_ID,
      part: '',
      document: 0,
    })
  },
  async BENCH_EVENT(store, event) {
    await benchProjection(store, event)
  },
})

export const makeResolvers = (getTableName) => ({
  async countBenchEvents(store) {
    const eventCounterTableName = getTableName(0)
    const result = await store.findOne(eventCounterTableName, {
      id: EVENT_COUNTER_ROW_ID,
    })

    if (result == null || result.document == null) {
      return 0
    }

    return +result.document
  },
})
