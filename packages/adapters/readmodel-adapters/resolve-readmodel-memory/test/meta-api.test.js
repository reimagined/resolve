import metaApi from '../src/meta-api'

describe('resolve-readmodel-memory meta-api', () => {
  it('should provide getLastTimestamp method', async () => {
    const pool = { metaInfo: { timestamp: 10 } }
    const result = await metaApi.getLastTimestamp(pool)
    expect(result).toEqual(10)
  })

  it('should provide setLastTimestamp method', async () => {
    const pool = { metaInfo: { timestamp: 10 } }
    await metaApi.setLastTimestamp(pool, 20)
    expect(pool.metaInfo.timestamp).toEqual(20)
  })

  it('should provide tableExists method', async () => {
    const pool = { metaInfo: { tables: { one: {} } } }
    let result = await metaApi.tableExists(pool, 'one')
    expect(result).toEqual(true)
    result = await metaApi.tableExists(pool, 'two')
    expect(result).toEqual(false)
  })

  it('should provide getTableInfo method', async () => {
    const metaInfoOne = {}
    const pool = { metaInfo: { tables: { one: metaInfoOne } } }
    const result = await metaApi.getTableInfo(pool, 'one')
    expect(result).toEqual(metaInfoOne)
  })

  it('should provide describeTable method', async () => {
    const pool = { metaInfo: { tables: {} } }
    const metaInfoOne = {}
    await metaApi.describeTable(pool, 'one', metaInfoOne)
    expect(pool.metaInfo.tables['one']).toEqual(metaInfoOne)
  })

  it('should provide getTableNames method', async () => {
    const pool = { metaInfo: { tables: { one: {}, two: {} } } }
    const result = await metaApi.getTableNames(pool)
    expect(result).toEqual(['one', 'two'])
  })

  it('should provide drop method with default arguments', async () => {
    const pool = {
      metaInfo: { tables: { one: {}, two: {} } },
      storage: { one: {}, two: {} }
    }
    await metaApi.drop(pool)
  })

  it('should provide drop method with custom arguments', async () => {
    const pool = {
      metaInfo: { tables: { one: {}, two: {} } },
      storage: { one: {}, two: {} }
    }
    await metaApi.drop(pool, { dropDataTables: true, dropMetaTable: true })
    expect(Object.keys(pool.metaInfo)).toEqual([])
    expect(Object.keys(pool.storage)).toEqual([])
  })
})
