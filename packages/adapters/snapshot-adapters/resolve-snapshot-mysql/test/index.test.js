import MySQL from 'mysql2/promise'
import createSnapshotAdapter from '../src'

describe('resolve-snapshot-mysql', () => {
  const bucketSize = 5
  let snapshotAdapter = null

  beforeEach(async () => {
    snapshotAdapter = createSnapshotAdapter({
      host: 'localhost',
      port: 3306,
      user: 'user',
      password: 'password',
      database: 'database',
      bucketSize
    })

    MySQL.createConnection().execute.mockImplementation(() => {})
  })

  afterEach(async () => {
    MySQL.createConnection().execute.mockReset()

    if (snapshotAdapter != null) {
      await snapshotAdapter.dispose()
    }
  })

  test(`"saveSnapshot" should save the snapshot every 5 times`, async () => {
    await snapshotAdapter.init()

    for (let index = 0; index < bucketSize; index++) {
      await snapshotAdapter.saveSnapshot('key', `value = ${index}`)
    }
    await snapshotAdapter.saveSnapshot('key', `value = ${bucketSize}`)

    expect(MySQL.createConnection().execute.mock.calls).toMatchSnapshot()
  })

  test(`"loadSnapshot" should load the snapshot`, async () => {
    MySQL.createConnection().execute.mockReturnValueOnce([
      [{ SnapshotContent: '"value"' }]
    ])

    const value = await snapshotAdapter.loadSnapshot('key')

    expect(MySQL.createConnection().execute.mock.calls).toMatchSnapshot()
    expect(value).toMatchSnapshot()
  })

  test(`"drop" should drop the snapshotAdapter`, async () => {
    await snapshotAdapter.dropSnapshot('key')
    expect(MySQL.createConnection().execute.mock.calls).toMatchSnapshot()
  })

  test(`"dispose" should dispose the snapshotAdapter`, async () => {
    await snapshotAdapter.init()
    await snapshotAdapter.dispose()

    try {
      await snapshotAdapter.dispose()
      snapshotAdapter = null
      return Promise.reject(new Error('Test failed'))
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toEqual('Adapter is disposed')
      snapshotAdapter = null
    }
  })
})
