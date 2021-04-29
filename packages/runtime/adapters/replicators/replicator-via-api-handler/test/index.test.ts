import createReadModelAdapter from '../src'

describe('@resolve-js/replicator-via-api-handler', () => {
  //eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  let adapter = null! as ReturnType<typeof createReadModelAdapter>

  beforeEach(() => {
    adapter = createReadModelAdapter({
      targetApplicationUrl: 'http://localhost:3000',
    })
  })

  test('connect and disconnect should be successful', async () => {
    const store = await adapter.connect('replicator')
    await adapter.disconnect(store)
  })
})
