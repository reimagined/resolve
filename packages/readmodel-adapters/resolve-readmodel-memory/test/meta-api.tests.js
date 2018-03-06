import { expect } from 'chai'

import metaApi from '../src/meta-api'

describe('resolve-readmodel-memory meta-api', () => {
  it('should provide getLastTimestamp method', async () => {
    const pool = { metaInfo: { timestamp: 10 } }
    const result = await metaApi.getLastTimestamp(pool)
    expect(result).to.be.equal(10)
  })

  it('should provide setLastTimestamp method', async () => {
    const pool = { metaInfo: { timestamp: 10 } }
    await metaApi.setLastTimestamp(pool, 20)
    expect(pool.metaInfo.timestamp).to.be.equal(20)
  })

  it('should provide storageExists method', async () => {
    const pool = { metaInfo: { tables: { one: {} } } }
    let result = await metaApi.storageExists(pool, 'one')
    expect(result).to.be.equal(true)
    result = await metaApi.storageExists(pool, 'two')
    expect(result).to.be.equal(false)
  })

  it('should provide getStorageInfo method', async () => {
    const metaInfoOne = {}
    const pool = { metaInfo: { tables: { one: metaInfoOne } } }
    const result = await metaApi.getStorageInfo(pool, 'one')
    expect(result).to.be.equal(metaInfoOne)
  })

  it('should provide describeStorage method', async () => {
    const pool = { metaInfo: { tables: {} } }
    const metaInfoOne = {}
    await metaApi.describeStorage(pool, 'one', metaInfoOne)
    expect(pool.metaInfo.tables['one']).to.be.equal(metaInfoOne)
  })

  it('should provide getStorageNames method', async () => {
    const pool = { metaInfo: { tables: { one: {}, two: {} } } }
    const result = await metaApi.getStorageNames(pool)
    expect(result).to.be.deep.equal(['one', 'two'])
  })

  it('should provide drop method', async () => {
    const pool = {
      metaInfo: { tables: { one: {}, two: {} } },
      storage: { one: {}, two: {} }
    }
    await metaApi.drop(pool)
    expect(Object.keys(pool.metaInfo)).to.be.deep.equal([])
    expect(Object.keys(pool.storage)).to.be.deep.equal([])
  })
})
