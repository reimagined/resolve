import path from 'path'
import fs from 'fs'
import createSnapshotAdapter from '../src'

const snapshotStoragePath = path.join(__dirname, 'snapshotStorage.txt')

afterAll(() => {
  fs.unlinkSync(snapshotStoragePath)
})

describe('resolve-snapshot-lite', () => {
  test(`"saveSnapshot" should save the snapshot every 5 times ( mode: "memory" )`, async () => {
    const bucketSize = 5

    const snapshotAdapter = createSnapshotAdapter({ bucketSize })

    for (let index = 0; index < bucketSize; index++) {
      await snapshotAdapter.saveSnapshot('key', `value = ${index}`)

      expect(await snapshotAdapter.loadSnapshot('key')).toEqual(null)
    }

    await snapshotAdapter.saveSnapshot('key', `value = ${bucketSize}`)

    expect(await snapshotAdapter.loadSnapshot('key')).toEqual(
      `value = ${bucketSize}`
    )
  })

  test(`"saveSnapshot" should save the snapshot every 5 times ( mode: "file" )`, async () => {
    const bucketSize = 5

    const snapshotAdapter = createSnapshotAdapter({
      bucketSize,
      databaseFile: snapshotStoragePath
    })

    for (let index = 0; index < bucketSize; index++) {
      await snapshotAdapter.saveSnapshot('key', `value = ${index}`)

      expect(await snapshotAdapter.loadSnapshot('key')).toEqual(null)
    }

    await snapshotAdapter.saveSnapshot('key', `value = ${bucketSize}`)

    expect(await snapshotAdapter.loadSnapshot('key')).toEqual(
      `value = ${bucketSize}`
    )
  })

  test(`"saveSnapshot" should throw error when the snapshotAdapter is disposed`, async () => {
    const snapshotAdapter = createSnapshotAdapter({})

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
    const snapshotAdapter = createSnapshotAdapter({})

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
    const snapshotAdapter = createSnapshotAdapter({})

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

    const snapshotAdapter = createSnapshotAdapter({ bucketSize })

    for (let index = 0; index < 2; index++) {
      await snapshotAdapter.saveSnapshot('key1', 'value1')
      await snapshotAdapter.saveSnapshot('key3', 'value3')
    }

    expect(await snapshotAdapter.loadSnapshot('key1')).toEqual(`value1`)
    expect(await snapshotAdapter.loadSnapshot('key2')).toEqual(null)
    expect(await snapshotAdapter.loadSnapshot('key3')).toEqual(`value3`)

    await snapshotAdapter.drop('key1')
    await snapshotAdapter.drop('key2')
    await snapshotAdapter.drop('key3')

    expect(await snapshotAdapter.loadSnapshot('key1')).toEqual(null)
    expect(await snapshotAdapter.loadSnapshot('key2')).toEqual(null)
    expect(await snapshotAdapter.loadSnapshot('key3')).toEqual(null)
  })

  test(`"drop" should throw error when the snapshotAdapter is disposed`, async () => {
    const snapshotAdapter = createSnapshotAdapter({})

    await snapshotAdapter.drop('key')

    await snapshotAdapter.dispose()

    try {
      await snapshotAdapter.drop('key')
      return Promise.reject(new Error('Test failed'))
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toEqual('Adapter is disposed')
    }
  })
})
