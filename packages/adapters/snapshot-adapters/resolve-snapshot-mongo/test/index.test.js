import createSnapshotAdapter from '../src'

describe('resolve-snapshot-mongo', () => {
  test(`"saveSnapshot" should save the snapshot every 5 times`, async () => {
    const bucketSize = 5

    const snapshotAdapter = createSnapshotAdapter({
      url: 'mongodb://127.0.0.1:27017/TestDB',
      tableName: 'Snapshots',
      bucketSize
    })
    await snapshotAdapter.init()

    for (let index = 0; index < bucketSize; index++) {
      await snapshotAdapter.saveSnapshot('key', `value = ${index}`)

      expect(await snapshotAdapter.loadSnapshot('key')).toEqual(null)
    }

    await snapshotAdapter.saveSnapshot('key', `value = ${bucketSize}`)

    expect(await snapshotAdapter.loadSnapshot('key')).toEqual(
      `value = ${bucketSize}`
    )

    await snapshotAdapter.dispose()
  })

  test(`"saveSnapshot" should throw error when the snapshotAdapter is disposed`, async () => {
    const snapshotAdapter = createSnapshotAdapter({
      url: 'mongodb://127.0.0.1:27017/TestDB',
      tableName: 'Snapshots'
    })
    await snapshotAdapter.init()

    await snapshotAdapter.saveSnapshot('key', `value`)

    await snapshotAdapter.dispose()

    try {
      await snapshotAdapter.saveSnapshot('key', `value`)
      return Promise.reject(new Error('Test failed'))
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toEqual('Adapter is disposed')
    }
  })

  test(`"loadSnapshot" should throw error when the snapshotAdapter is disposed`, async () => {
    const snapshotAdapter = createSnapshotAdapter({
      url: 'mongodb://127.0.0.1:27017/TestDB',
      tableName: 'Snapshots'
    })
    await snapshotAdapter.init()

    await snapshotAdapter.loadSnapshot('key')

    await snapshotAdapter.dispose()

    try {
      await snapshotAdapter.loadSnapshot('key')
      return Promise.reject(new Error('Test failed'))
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toEqual('Adapter is disposed')
    }
  })

  test(`"dispose" should dispose the snapshotAdapter`, async () => {
    const snapshotAdapter = createSnapshotAdapter({
      url: 'mongodb://127.0.0.1:27017/TestDB',
      tableName: 'Snapshots'
    })
    await snapshotAdapter.init()

    await snapshotAdapter.dispose()

    try {
      await snapshotAdapter.dispose()
      return Promise.reject(new Error('Test failed'))
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toEqual('Adapter is disposed')
    }
  })

  test(`"drop" should drop the snapshotAdapter`, async () => {
    const bucketSize = 1

    const snapshotAdapter = createSnapshotAdapter({
      url: 'mongodb://127.0.0.1:27017/TestDB',
      tableName: 'Snapshots',
      bucketSize
    })
    await snapshotAdapter.init()

    for (let index = 0; index < 2; index++) {
      await snapshotAdapter.saveSnapshot('key1', 'value1')
      await snapshotAdapter.saveSnapshot('key3', 'value3')
    }

    expect(await snapshotAdapter.loadSnapshot('key1')).toEqual(`value1`)
    expect(await snapshotAdapter.loadSnapshot('key2')).toEqual(null)
    expect(await snapshotAdapter.loadSnapshot('key3')).toEqual(`value3`)

    await snapshotAdapter.dropSnapshot('key1')
    await snapshotAdapter.dropSnapshot('key2')
    await snapshotAdapter.dropSnapshot('key3')

    expect(await snapshotAdapter.loadSnapshot('key1')).toEqual(null)
    expect(await snapshotAdapter.loadSnapshot('key2')).toEqual(null)
    expect(await snapshotAdapter.loadSnapshot('key3')).toEqual(null)
    await snapshotAdapter.dispose()
  })

  test(`"drop" should throw error when the snapshotAdapter is disposed`, async () => {
    const snapshotAdapter = createSnapshotAdapter({
      url: 'mongodb://127.0.0.1:27017/TestDB',
      tableName: 'Snapshots'
    })
    await snapshotAdapter.init()

    await snapshotAdapter.dropSnapshot('key')

    await snapshotAdapter.dispose()

    try {
      await snapshotAdapter.dropSnapshot('key')
      return Promise.reject(new Error('Test failed'))
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toEqual('Adapter is disposed')
    }
  })
})
