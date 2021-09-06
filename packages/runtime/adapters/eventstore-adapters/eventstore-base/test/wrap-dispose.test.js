import sinon from 'sinon'
import wrapDispose from '../src/wrap-dispose'

test('wrap dispose should bypass on correct arguments', async () => {
  const rawDispose = sinon.stub().callsFake(async () => null)
  const pool = { isConnected: true }

  const dispose = wrapDispose(pool, rawDispose)
  await dispose()

  expect(rawDispose.callCount).toEqual(1)

  expect(pool.disposed).toEqual(true)
})

test.skip('wrap dispose should fail on wrong arguments', async () => {
  const rawDispose = sinon.stub().callsFake(async () => null)
  const pool = { isConnected: true }

  try {
    const dispose = wrapDispose(pool, rawDispose)
    await dispose(123)

    return Promise.reject('Test failed')
  } catch (error) {
    expect(error).toBeInstanceOf(Error)

    expect(error.message).toEqual(
      'Dispose options should be object or not be passed to use default behaviour'
    )
  }
})
