import sinon from 'sinon'
import sqlFormatter from 'sql-formatter'

import storeApi from '../src/store-api'

describe('resolve-readmodel-mysql store-api', () => {
  const MAX_VALUE = 0x0fffffff | 0
  const format = sqlFormatter.format.bind(sqlFormatter)

  let executor, pool

  beforeEach(() => {
    executor = sinon.stub()

    pool = {
      escapeId: sinon
        .stub()
        .callsFake(value => `\`${value.replace(/`/g, '``')}\``),
      connection: { execute: executor },
      metaInfo: {
        tables: {
          test: {
            id: 'primary',
            search: 'secondary',
            sort: 'secondary',
            volume: 'secondary',
            one: 'secondary',
            two: 'secondary',
            value: 'regular',
            inner: 'regular'
          }
        }
      }
    }
  })

  afterEach(() => {
    executor = null
    pool = null
  })

  it('should provide defineTable method', async () => {
    await storeApi.defineTable(pool, 'test', {
      first: 'primary-string',
      second: 'secondary-number',
      third: 'secondary-string'
    })

    expect(format(executor.firstCall.args[0])).toEqual(
      format(
        `CREATE TABLE \`test\` (
          \`first\` VARCHAR(700) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
          \`second\` BIGINT NULL,
          \`third\` VARCHAR(700) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
          PRIMARY KEY (\`first\`),
          INDEX USING BTREE (\`second\`),
          INDEX USING BTREE (\`third\`)
        )`
      )
    )
  })

  it('should provide find method - search logical/comparison operators', async () => {
    const gaugeResultSet = []
    executor.onCall(0).callsFake(async () => [gaugeResultSet])

    const result = await storeApi.find(
      pool,
      'test',
      {
        $and: [
          {
            $or: [{ timestamp: { $lt: 100 } }, { 'inner.value': { $gt: 1000 } }]
          },
          { $not: { volume: { $eq: 'volume' } } }
        ]
      },
      { field: 1, 'inner.field': 1 },
      { sort: -1, 'inner.sort': 1 },
      10,
      20
    )

    expect(format(executor.firstCall.args[0])).toEqual(
      format(
        `SELECT \`field\`, \`inner\`->'$."field"' AS \`inner.field\`
         FROM \`test\`
         WHERE ((\`timestamp\` < ?) OR (\`inner\` -> '$."value"' > CAST(? AS JSON)))
           AND (NOT (\`volume\` = ?))
         ORDER BY \`sort\` DESC, \`inner\`->'$."sort"' ASC
         LIMIT 10, 20`
      )
    )

    expect(executor.firstCall.args[1]).toEqual([100, '1000', 'volume'])

    expect(result).toEqual(gaugeResultSet)
  })

  it('should provide find method - all arguments passed', async () => {
    const gaugeResultSet = []
    executor.onCall(0).callsFake(async () => [gaugeResultSet])

    const result = await storeApi.find(
      pool,
      'test',
      { search: 0, 'inner.search': 1 },
      { field: 1, 'inner.field': 1 },
      { sort: -1, 'inner.sort': 1 },
      10,
      20
    )

    expect(format(executor.firstCall.args[0])).toEqual(
      format(
        `SELECT \`field\`, \`inner\`->'$."field"' AS \`inner.field\`
         FROM \`test\`
         WHERE \`search\` = ? AND \`inner\`->'$."search"' = CAST(? AS JSON)
         ORDER BY \`sort\` DESC, \`inner\`->'$."sort"' ASC
         LIMIT 10, 20`
      )
    )

    expect(executor.firstCall.args[1]).toEqual([0, '1'])

    expect(result).toEqual(gaugeResultSet)
  })

  it('should provide find method - no projection passed', async () => {
    const gaugeResultSet = []
    executor.onCall(0).callsFake(async () => [gaugeResultSet])

    const result = await storeApi.find(
      pool,
      'test',
      { search: 0, 'inner.search': 1 },
      null,
      { sort: -1, 'inner.sort': 1 },
      10,
      20
    )

    expect(format(executor.firstCall.args[0])).toEqual(
      format(
        `SELECT * FROM \`test\`
         WHERE \`search\` = ? AND \`inner\`->'$."search"' = CAST(? AS JSON)
         ORDER BY \`sort\` DESC, \`inner\`->'$."sort"' ASC
         LIMIT 10, 20`
      )
    )

    expect(executor.firstCall.args[1]).toEqual([0, '1'])

    expect(result).toEqual(gaugeResultSet)
  })

  it('should provide find method - no sort passed', async () => {
    const gaugeResultSet = []
    executor.onCall(0).callsFake(async () => [gaugeResultSet])

    const result = await storeApi.find(
      pool,
      'test',
      { search: 0, 'inner.search': 1 },
      { field: 1, 'inner.field': 1 },
      null,
      10,
      20
    )

    expect(format(executor.firstCall.args[0])).toEqual(
      format(
        `SELECT \`field\`, \`inner\`->'$."field"' AS \`inner.field\`
         FROM \`test\`
         WHERE \`search\` = ? AND \`inner\`->'$."search"' = CAST(? AS JSON)
         LIMIT 10, 20`
      )
    )

    expect(executor.firstCall.args[1]).toEqual([0, '1'])

    expect(result).toEqual(gaugeResultSet)
  })

  it('should provide find method - no skip passed', async () => {
    const gaugeResultSet = []
    executor.onCall(0).callsFake(async () => [gaugeResultSet])

    const result = await storeApi.find(
      pool,
      'test',
      { search: 0, 'inner.search': 1 },
      { field: 1, 'inner.field': 1 },
      { sort: -1, 'inner.sort': 1 },
      Infinity,
      20
    )

    expect(format(executor.firstCall.args[0])).toEqual(
      format(
        `SELECT \`field\`, \`inner\`->'$."field"' AS \`inner.field\`
         FROM \`test\`
         WHERE \`search\` = ? AND \`inner\`->'$."search"' = CAST(? AS JSON)
         ORDER BY \`sort\` DESC, \`inner\`->'$."sort"' ASC
         LIMIT 0, 20`
      )
    )

    expect(executor.firstCall.args[1]).toEqual([0, '1'])

    expect(result).toEqual(gaugeResultSet)
  })

  it('should provide find method - no limit passed', async () => {
    const gaugeResultSet = []
    executor.onCall(0).callsFake(async () => [gaugeResultSet])

    const result = await storeApi.find(
      pool,
      'test',
      { search: 0, 'inner.search': 1 },
      { field: 1, 'inner.field': 1 },
      { sort: -1, 'inner.sort': 1 },
      10,
      Infinity
    )

    expect(format(executor.firstCall.args[0])).toEqual(
      format(
        `SELECT \`field\`, \`inner\`->'$."field"' AS \`inner.field\`
         FROM \`test\`
         WHERE \`search\` = ? AND \`inner\`->'$."search"' = CAST(? AS JSON)
         ORDER BY \`sort\` DESC, \`inner\`->'$."sort"' ASC
         LIMIT 10, ${MAX_VALUE}`
      )
    )

    expect(executor.firstCall.args[1]).toEqual([0, '1'])

    expect(result).toEqual(gaugeResultSet)
  })

  it('should provide findOne method - all arguments passed', async () => {
    const gaugeResult = {}
    executor.onCall(0).callsFake(async () => [[gaugeResult]])

    const result = await storeApi.findOne(
      pool,
      'test',
      { search: 0, 'inner.search': 1 },
      { field: 1, 'inner.field': 1 }
    )

    expect(format(executor.firstCall.args[0])).toEqual(
      format(
        `SELECT \`field\`, \`inner\`->'$."field"' AS \`inner.field\`
         FROM \`test\`
         WHERE \`search\` = ? AND \`inner\`->'$."search"' = CAST(? AS JSON)
         LIMIT 0, 1`
      )
    )

    expect(executor.firstCall.args[1]).toEqual([0, '1'])

    expect(result).toEqual(gaugeResult)
  })

  it('should provide findOne method - no projection passed', async () => {
    const gaugeResult = {}
    executor.onCall(0).callsFake(async () => [[gaugeResult]])

    const result = await storeApi.findOne(
      pool,
      'test',
      { search: 0, 'inner.search': 1 },
      null
    )

    expect(format(executor.firstCall.args[0])).toEqual(
      format(
        `SELECT * FROM \`test\`
         WHERE \`search\` = ? AND \`inner\`->'$."search"' = CAST(? AS JSON)
         LIMIT 0, 1`
      )
    )

    expect(executor.firstCall.args[1]).toEqual([0, '1'])

    expect(result).toEqual(gaugeResult)
  })

  it('should provide count method', async () => {
    executor.onCall(0).callsFake(async () => [[{ Count: 100 }]])

    const result = await storeApi.count(pool, 'test', {
      search: 0,
      'inner.search': 1
    })

    expect(format(executor.firstCall.args[0])).toEqual(
      format(
        `SELECT Count(*) AS Count FROM \`test\`
         WHERE \`search\` = ? AND
           \`inner\`->'$."search"' = CAST(? AS JSON)`
      )
    )

    expect(executor.firstCall.args[1]).toEqual([0, '1'])

    expect(result).toEqual(100)
  })

  it('should provide insert method', async () => {
    await storeApi.insert(pool, 'test', { id: 1, value: 2 })

    expect(format(executor.firstCall.args[0])).toEqual(
      format(
        `INSERT INTO \`test\`(\`id\`, \`value\`) VALUES(?, CAST(? AS JSON))`
      )
    )

    expect(executor.firstCall.args[1]).toEqual([1, '2'])
  })

  it('should provide update method', async () => {
    await storeApi.update(
      pool,
      'test',
      { id: 1, 'inner.value': 2 },
      {
        $set: { one: 10, 'inner.one': 20 },
        $unset: { two: true, 'inner.two': true },
        $inc: { counter: 3, 'inner.counter': 4 }
      },
      { upsert: false }
    )

    expect(format(executor.firstCall.args[0])).toEqual(
      format(
        `UPDATE \`test\` SET \`one\` = ?,
           \`inner\` = JSON_SET(\`inner\`, '$."one"', CAST(? AS JSON)),
           \`two\` = NULL, \`inner\` = JSON_REMOVE(\`inner\`, '$."two"'),
           \`counter\` = \`counter\` + ?,
           \`inner\` = JSON_SET(\`inner\`, '$."counter"',
             JSON_EXTRACT(\`inner\`, '$."counter"') + ?
           )
         WHERE \`id\` = ? AND
           \`inner\`->'$."value"' = CAST(? AS JSON)`
      )
    )

    expect(executor.firstCall.args[1]).toEqual([10, '20', 3, 4, 1, '2'])
  })

  it('should provide del method', async () => {
    await storeApi.del(pool, 'test', { id: 1, 'inner.value': 2 })

    expect(format(executor.firstCall.args[0])).toEqual(
      format(
        `DELETE FROM \`test\`
          WHERE \`id\`= ? AND
          \`inner\`->'$."value"' = CAST(? AS JSON)`
      )
    )

    expect(executor.firstCall.args[1]).toEqual([1, '2'])
  })
})
