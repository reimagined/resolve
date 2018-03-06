import { expect } from 'chai'
import sinon from 'sinon'
import sqlFormatter from 'sql-formatter'

import storeApi from '../src/store-api'

describe('resolve-readmodel-mysql store-api', () => {
  const MAX_VALUE = 0x0fffffff | 0
  const format = sqlFormatter.format.bind(sqlFormatter)

  it('should provide defineStorage method', async () => {
    const executor = sinon.stub()
    const pool = { connection: { execute: executor } }

    await storeApi.defineStorage(pool, 'test', {
      fieldTypes: { first: 'number', second: 'string', third: 'string' },
      primaryIndex: { name: 'first' },
      secondaryIndexes: [{ name: 'second' }, { name: 'third' }]
    })

    expect(format(executor.firstCall.args[0])).to.be.equal(
      format(
        `CREATE TABLE test (
          first BIGINT NOT NULL,
          second VARCHAR(255) NOT NULL,
          third VARCHAR(255) NOT NULL,
          PRIMARY KEY (first),
          INDEX USING BTREE (second),
          INDEX USING BTREE (third)
        )`
      )
    )
  })

  it('should provide find method - all arguments passed', async () => {
    const executor = sinon.stub()
    const pool = { connection: { execute: executor } }

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

    expect(format(executor.firstCall.args[0])).to.be.equal(
      format(
        `SELECT field, inner->>'$."field"' AS "inner.field"
         FROM test
         WHERE search = ? AND inner->>'$."search"' = ?
         ORDER BY sort DESC, inner->>'$."sort"' ASC
         LIMIT 10,20`
      )
    )

    expect(executor.firstCall.args[1]).to.be.deep.equal([0, 1])

    expect(result).to.be.equal(gaugeResultSet)
  })

  it('should provide find method - no projection passed', async () => {
    const executor = sinon.stub()
    const pool = { connection: { execute: executor } }

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

    expect(format(executor.firstCall.args[0])).to.be.equal(
      format(
        `SELECT * FROM test
         WHERE search = ? AND inner->>'$."search"' = ? \n
         ORDER BY sort DESC, inner->>'$."sort"' ASC
         LIMIT 10,20`
      )
    )

    expect(executor.firstCall.args[1]).to.be.deep.equal([0, 1])

    expect(result).to.be.equal(gaugeResultSet)
  })

  it('should provide find method - no sort passed', async () => {
    const executor = sinon.stub()
    const pool = { connection: { execute: executor } }

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

    expect(format(executor.firstCall.args[0])).to.be.equal(
      format(
        `SELECT field, inner->>'$."field"' AS "inner.field"
         FROM test
         WHERE search = ? AND inner->>'$."search"' = ?
         LIMIT 10,20`
      )
    )

    expect(executor.firstCall.args[1]).to.be.deep.equal([0, 1])

    expect(result).to.be.equal(gaugeResultSet)
  })

  it('should provide find method - no skip passed', async () => {
    const executor = sinon.stub()
    const pool = { connection: { execute: executor } }

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

    expect(format(executor.firstCall.args[0])).to.be.equal(
      format(
        `SELECT field, inner->>'$."field"' AS "inner.field"
         FROM test
         WHERE search = ? AND inner->>'$."search"' = ?
         ORDER BY sort DESC, inner->>'$."sort"' ASC
         LIMIT 0,20`
      )
    )

    expect(executor.firstCall.args[1]).to.be.deep.equal([0, 1])

    expect(result).to.be.equal(gaugeResultSet)
  })

  it('should provide find method - no limit passed', async () => {
    const executor = sinon.stub()
    const pool = { connection: { execute: executor } }

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

    expect(format(executor.firstCall.args[0])).to.be.equal(
      format(
        `SELECT field, inner->>'$."field"' AS "inner.field"
         FROM test
         WHERE search = ? AND inner->>'$."search"' = ?
         ORDER BY sort DESC, inner->>'$."sort"' ASC
         LIMIT 10,${MAX_VALUE}`
      )
    )

    expect(executor.firstCall.args[1]).to.be.deep.equal([0, 1])

    expect(result).to.be.equal(gaugeResultSet)
  })

  it('should provide findOne method - all arguments passed', async () => {
    const executor = sinon.stub()
    const pool = { connection: { execute: executor } }

    const gaugeResult = {}
    executor.onCall(0).callsFake(async () => [[gaugeResult]])

    const result = await storeApi.findOne(
      pool,
      'test',
      { search: 0, 'inner.search': 1 },
      { field: 1, 'inner.field': 1 }
    )

    expect(format(executor.firstCall.args[0])).to.be.equal(
      format(
        `SELECT field, inner->>'$."field"' AS "inner.field"
         FROM test
         WHERE search = ? AND inner->>'$."search"' = ?
         LIMIT 0, 1`
      )
    )

    expect(executor.firstCall.args[1]).to.be.deep.equal([0, 1])

    expect(result).to.be.equal(gaugeResult)
  })

  it('should provide findOne method - no projection passed', async () => {
    const executor = sinon.stub()
    const pool = { connection: { execute: executor } }

    const gaugeResult = {}
    executor.onCall(0).callsFake(async () => [[gaugeResult]])

    const result = await storeApi.findOne(
      pool,
      'test',
      { search: 0, 'inner.search': 1 },
      null
    )

    expect(format(executor.firstCall.args[0])).to.be.equal(
      format(
        `SELECT * FROM test
         WHERE search = ? AND inner->>'$."search"' = ?
         LIMIT 0, 1`
      )
    )

    expect(executor.firstCall.args[1]).to.be.deep.equal([0, 1])

    expect(result).to.be.equal(gaugeResult)
  })

  it('should provide count method', async () => {
    const executor = sinon.stub()
    const pool = { connection: { execute: executor } }

    executor.onCall(0).callsFake(async () => [[{ Count: 100 }]])

    const result = await storeApi.count(pool, 'test', {
      search: 0,
      'inner.search': 1
    })

    expect(format(executor.firstCall.args[0])).to.be.equal(
      format(
        `SELECT Count(*) AS Count FROM test
         WHERE search = ? AND inner->>'$."search"' = ?`
      )
    )

    expect(executor.firstCall.args[1]).to.be.deep.equal([0, 1])

    expect(result).to.be.equal(100)
  })

  it('should provide insert method', async () => {
    const executor = sinon.stub()
    const pool = { connection: { execute: executor } }

    await storeApi.insert(pool, 'test', { id: 1, value: 2 })

    expect(format(executor.firstCall.args[0])).to.be.equal(
      format(`INSERT INTO test(id, value) VALUES(?, ?)`)
    )

    expect(executor.firstCall.args[1]).to.be.deep.equal([1, 2])
  })

  it('should provide update method', async () => {
    const executor = sinon.stub()
    const pool = { connection: { execute: executor } }

    await storeApi.update(
      pool,
      'test',
      { id: 1, 'inner.value': 2 },
      {
        $set: { one: 10, 'inner.one': 20 },
        $unset: { two: true, 'inner.two': true },
        $inc: { counter: 3, 'inner.counter': 4 }
      }
    )

    expect(format(executor.firstCall.args[0])).to.be.equal(
      format(
        `UPDATE test SET one = ?, inner = JSON_SET(inner, '$."one"', ?),
         two = NULL, inner = JSON_REMOVE(inner, '$."two"'),
         counter = counter + ?,
         inner = JSON_SET(inner, '$."counter"',
           JSON_EXTRACT(inner, '$."counter"') + ?
         )
         WHERE id = ? AND inner->>'$."value"' = ?`
      )
    )

    expect(executor.firstCall.args[1]).to.be.deep.equal([10, 20, 3, 4, 1, 2])
  })

  it('should provide del method', async () => {
    const executor = sinon.stub()
    const pool = { connection: { execute: executor } }

    await storeApi.del(pool, 'test', { id: 1, 'inner.value': 2 })

    expect(format(executor.firstCall.args[0])).to.be.equal(
      format(`DELETE FROM test WHERE id = ? AND inner->>'$."value"' = ?`)
    )

    expect(executor.firstCall.args[1]).to.be.deep.equal([1, 2])
  })
})
