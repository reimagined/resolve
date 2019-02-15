import updateByEvents from '../src/update-by-events'

test('Read-model update by events should throw on disposed state', async () => {
  try {
    await updateByEvents(null, 123)
    return Promise.reject('Test failed')
  } catch (error) {
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toEqual(
      'Updating by events should supply events array'
    )
  }
})
