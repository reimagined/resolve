import { expect } from 'chai'
import sinon from 'sinon'
import sqlFormatter from 'sql-formatter'

import metaApi from '../src/meta-api'

describe('resolve-readmodel-mysql meta-api', () => {
  const META_NAME = 'META_NAME'
  const format = sqlFormatter.format.bind(sqlFormatter)

  let executor, pool, checkStoredTableSchema

  beforeEach(() => {
    checkStoredTableSchema = sinon.stub()
    executor = sinon.stub()

    pool = {
      escapeId: sinon
        .stub()
        .callsFake(value => `\`${value.replace(/`/g, '``')}\``),
      connection: { execute: executor },
      metaName: META_NAME
    }
  })

  afterEach(() => {
    checkStoredTableSchema = null
    executor = null
    pool = null
  })

  it('should provide getMetaInfo method - for initialized meta table', async () => {
    const tableDeclarations = [
      {
        TableName: 'table1',
        TableDescription: {
          id: 'primary-string',
          vol: 'secondary-number',
          content: 'regular'
        }
      },
      {
        TableName: 'table2',
        TableDescription: {
          id: 'primary-string',
          vol: 'secondary-number',
          content: 'regular'
        }
      }
    ]

    executor.onCall(1).callsFake(async () => [[{ Timestamp: 100 }]])
    executor.onCall(2).callsFake(async () => [tableDeclarations])

    checkStoredTableSchema.onCall(0).callsFake(() => true)
    checkStoredTableSchema.onCall(1).callsFake(() => true)

    await metaApi.getMetaInfo(pool, checkStoredTableSchema)
    expect(pool.metaInfo.tables['table1']).to.be.deep.equal(
      tableDeclarations[0].TableDescription
    )
    expect(pool.metaInfo.tables['table2']).to.be.deep.equal(
      tableDeclarations[1].TableDescription
    )
    expect(pool.metaInfo.timestamp).to.be.equal(100)

    expect(format(executor.firstCall.args[0])).to.be.equal(
      format(
        `CREATE TABLE IF NOT EXISTS \`META_NAME\` (
          FirstKey VARCHAR(128) NOT NULL,
          SecondKey VARCHAR(128) NULL,
          Value JSON NULL
        )`
      )
    )

    expect(format(executor.secondCall.args[0])).to.be.equal(
      format(
        `SELECT Value AS Timestamp FROM \`META_NAME\` WHERE FirstKey="Timestamp"`
      )
    )

    expect(format(executor.thirdCall.args[0])).to.be.equal(
      format(
        `SELECT SecondKey AS TableName, Value AS TableDescription
         FROM \`META_NAME\`
         WHERE FirstKey="TableDescriptor"`
      )
    )
  })

  it('should provide getMetaInfo method - for empty meta table', async () => {
    executor.onCall(1).callsFake(async () => [[]])
    executor.onCall(3).callsFake(async () => [[]])

    checkStoredTableSchema.onCall(0).callsFake(() => false)
    checkStoredTableSchema.onCall(1).callsFake(() => false)

    await metaApi.getMetaInfo(pool, checkStoredTableSchema)
    expect(pool.metaInfo.tables).to.be.deep.equal({})
    expect(pool.metaInfo.timestamp).to.be.equal(0)

    expect(format(executor.getCall(0).args[0])).to.be.equal(
      format(
        `CREATE TABLE IF NOT EXISTS \`META_NAME\` (
          FirstKey VARCHAR(128) NOT NULL,
          SecondKey VARCHAR(128) NULL,
          Value JSON NULL
        )`
      )
    )

    expect(format(executor.getCall(1).args[0])).to.be.equal(
      format(
        `SELECT Value AS Timestamp FROM \`META_NAME\` WHERE FirstKey="Timestamp"`
      )
    )

    expect(format(executor.getCall(2).args[0])).to.be.equal(
      format(
        `INSERT INTO \`META_NAME\`(FirstKey, Value)
         VALUES("Timestamp", CAST("0" AS JSON))`
      )
    )

    expect(format(executor.getCall(3).args[0])).to.be.equal(
      format(
        `SELECT SecondKey AS TableName, Value AS TableDescription
         FROM \`META_NAME\`
         WHERE FirstKey="TableDescriptor"`
      )
    )
  })

  it('should provide getMetaInfo method - for malformed meta table', async () => {
    const tableDeclarations = [
      {
        TableName: 'table',
        TableDescription: {
          field: 'error'
        }
      }
    ]

    executor.onCall(1).callsFake(async () => [[{ Timestamp: 'NaN' }]])
    executor.onCall(2).callsFake(async () => [tableDeclarations])

    checkStoredTableSchema.onCall(0).callsFake(() => false)
    checkStoredTableSchema.onCall(1).callsFake(() => false)

    await metaApi.getMetaInfo(pool, checkStoredTableSchema)
    expect(pool.metaInfo.tables).to.be.deep.equal({})
    expect(pool.metaInfo.timestamp).to.be.equal(0)

    expect(format(executor.getCall(0).args[0])).to.be.equal(
      format(
        `CREATE TABLE IF NOT EXISTS \`META_NAME\` (
          FirstKey VARCHAR(128) NOT NULL,
          SecondKey VARCHAR(128) NULL,
          Value JSON NULL
        )`
      )
    )

    expect(format(executor.getCall(1).args[0])).to.be.equal(
      format(
        `SELECT Value AS Timestamp FROM \`META_NAME\` WHERE FirstKey="Timestamp"`
      )
    )

    expect(format(executor.getCall(2).args[0])).to.be.equal(
      format(
        `SELECT SecondKey AS TableName, Value AS TableDescription
         FROM \`META_NAME\`
         WHERE FirstKey="TableDescriptor"`
      )
    )

    expect(format(executor.getCall(3).args[0])).to.be.equal(
      format(
        `DELETE FROM \`META_NAME\` WHERE FirstKey="TableDescriptor" AND SecondKey = ?`
      )
    )

    expect(executor.getCall(3).args[1]).to.be.deep.equal(['table'])
  })

  it('should provide getLastTimestamp method', async () => {
    pool = { metaInfo: { timestamp: 10 } }

    const result = await metaApi.getLastTimestamp(pool)

    expect(result).to.be.equal(10)
  })

  it('should provide setLastTimestamp method', async () => {
    executor.onCall(0).callsFake(async () => null)
    pool.metaInfo = { timestamp: 10 }

    await metaApi.setLastTimestamp(pool, 20)
    expect(format(executor.firstCall.args[0])).to.be.equal(
      format(
        `UPDATE \`META_NAME\` SET Value=CAST(? AS JSON) WHERE FirstKey="Timestamp"`
      )
    )
    expect(executor.firstCall.args[1]).to.be.deep.equal(['20'])

    expect(pool.metaInfo.timestamp).to.be.equal(20)
  })

  it('should provide tableExists method', async () => {
    pool = { metaInfo: { tables: { one: {} } } }

    let result = await metaApi.tableExists(pool, 'one')
    expect(result).to.be.equal(true)

    result = await metaApi.tableExists(pool, 'two')
    expect(result).to.be.equal(false)
  })

  it('should provide getTableInfo method', async () => {
    const metaInfoOne = {}
    pool = { metaInfo: { tables: { one: metaInfoOne } } }

    const result = await metaApi.getTableInfo(pool, 'one')

    expect(result).to.be.equal(metaInfoOne)
  })

  it('should provide describeTable method', async () => {
    pool.metaInfo = { tables: {} }
    const metaInfoOne = {}

    await metaApi.describeTable(pool, 'one', metaInfoOne)
    expect(pool.metaInfo.tables['one']).to.be.equal(metaInfoOne)

    expect(format(executor.firstCall.args[0])).to.be.equal(
      format(
        `INSERT INTO \`META_NAME\`(FirstKey, SecondKey, Value)
         VALUES("TableDescriptor", ?, CAST(? AS JSON))`
      )
    )

    expect(executor.firstCall.args[1][0]).to.be.equal('one')
    expect(executor.firstCall.args[1][1]).to.be.equal(
      JSON.stringify(metaInfoOne)
    )
  })

  it('should provide getTableNames method', async () => {
    pool.metaInfo = { tables: { one: {}, two: {} } }

    const result = await metaApi.getTableNames(pool)

    expect(result).to.be.deep.equal(['one', 'two'])
  })

  it('should provide drop method', async () => {
    pool.metaInfo = { tables: { one: {}, two: {} } }

    await metaApi.drop(pool)

    expect(format(executor.firstCall.args[0])).to.be.equal(
      format('DROP TABLE `one`')
    )
    expect(format(executor.secondCall.args[0])).to.be.equal(
      format('DROP TABLE `two`')
    )
    expect(format(executor.thirdCall.args[0])).to.be.equal(
      format('DROP TABLE `META_NAME`')
    )

    expect(Object.keys(pool.metaInfo)).to.be.deep.equal([])
  })
})
