import wrapSaveEvent from '../src/wrap-save-event'

test('method "wrapSaveEvent" should return wrapped saveEvent with isFrozen validation', async () => {
  const saveEvent = jest.fn()
  const isFrozen = jest.fn().mockReturnValue(false)

  const pool = {
    isFrozen
  }
  const event = { type: 'EVENT' }

  const wrappedSaveEvent = wrapSaveEvent(saveEvent)

  await wrappedSaveEvent(pool, event)

  expect(saveEvent).toHaveBeenCalledWith(pool, event)
  expect(isFrozen).toHaveBeenCalledWith()
})

test('method "wrapSaveEvent" should return wrapped saveEvent and call should throw an error "Event store is frozen"', async () => {
  const saveEvent = jest.fn()
  const isFrozen = jest.fn().mockReturnValue(true)

  const pool = {
    isFrozen
  }
  const event = { type: 'EVENT' }

  const wrappedSaveEvent = wrapSaveEvent(saveEvent)

  try {
    await wrappedSaveEvent(pool, event)

    return Promise.reject(new Error('Test failed'))
  } catch (error) {
    expect(error.message).toEqual('Event store is frozen')
  }

  expect(saveEvent).not.toHaveBeenCalled()
  expect(isFrozen).toHaveBeenCalledWith()
})
