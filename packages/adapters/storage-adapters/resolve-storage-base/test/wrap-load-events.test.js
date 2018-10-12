import sinon from 'sinon'

import wrapLoadEvents from '../src/wrap-load-events'

test('wrap load events should bypass on correct arguments', async () => {
  const rawLoadEvents = sinon.stub().callsFake(async () => null)
  const pool = {}

  const loadEvents = wrapLoadEvents(rawLoadEvents, 'criteria')
  await loadEvents(pool, ['event_type'], () => null, 123)

  expect(rawLoadEvents.callCount).toEqual(1)
})

test('wrap load events should fail on wrong criteria argument', async () => {
  const rawLoadEvents = sinon.stub().callsFake(async () => null)
  const pool = {}

  try {
    const loadEvents = wrapLoadEvents(rawLoadEvents, 123)
    await loadEvents(pool, [], () => null, 0)

    return Promise.reject('Test failed')
  } catch (error) {
    expect(error).toBeInstanceOf(Error)

    expect(error.message).toEqual('Wrong criteria field descriptor 123')
  }
})

test('wrap load events should fail on wrong criteria values', async () => {
  const rawLoadEvents = sinon.stub().callsFake(async () => null)
  const pool = {}

  try {
    const loadEvents = wrapLoadEvents(rawLoadEvents, 'criteria')
    await loadEvents(pool, [123], () => null, 0)

    return Promise.reject('Test failed')
  } catch (error) {
    expect(error).toBeInstanceOf(Error)

    expect(error.message).toEqual(
      'Field criteria should be an array of strings'
    )
  }
})

test('wrap load events should fail on wrong callback type', async () => {
  const rawLoadEvents = sinon.stub().callsFake(async () => null)
  const pool = {}

  try {
    const loadEvents = wrapLoadEvents(rawLoadEvents, 'criteria')
    await loadEvents(pool, ['event_type'], 123)

    return Promise.reject('Test failed')
  } catch (error) {
    expect(error).toBeInstanceOf(Error)

    expect(error.message).toEqual('Callback should be function')
  }
})

test('wrap load events should fail on wrong initial timestamp', async () => {
  const rawLoadEvents = sinon.stub().callsFake(async () => null)
  const pool = {}

  try {
    const loadEvents = wrapLoadEvents(rawLoadEvents, 'criteria')
    await loadEvents(pool, ['event_type'], () => null, '123')

    return Promise.reject('Test failed')
  } catch (error) {
    expect(error).toBeInstanceOf(Error)

    expect(error.message).toEqual('Start time should be an integer value')
  }
})
