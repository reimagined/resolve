import createStorageAdapter from 'resolve-storage-lite'

const pipePromisify = (inputStream, outputStream, status) => {
  let ended = false
  const end = () => {
    if (!ended) {
      ended = true
      if (typeof outputStream.close === 'function') {
        outputStream.close()
      }
      if (typeof inputStream.close === 'function') {
        inputStream.close()
      }
      return true
    }
    return false
  }
  return new Promise((resolve, reject) => {
    const finishHandler = () => {
      if (end()) {
        resolve(status)
      }
    }
    const errorHandler = error => {
      if (end()) {
        reject(error)
      }
    }
    inputStream.pipe(outputStream)
    inputStream.on('error', errorHandler)
    outputStream.on('finish', finishHandler)
    outputStream.on('end', finishHandler)
    outputStream.on('error', errorHandler)
  })
}

test('import-export', async () => {
  const inputStorageAdapter = createStorageAdapter({
    databaseFile: ':memory:'
  })
  const outputStorageAdapter = createStorageAdapter({
    databaseFile: ':memory:'
  })

  const inputCountEvents = 300

  for (let eventIndex = 0; eventIndex < inputCountEvents; eventIndex++) {
    await inputStorageAdapter.saveEvent({
      aggregateId: 'aggregateId',
      aggregateVersion: eventIndex + 1,
      type: 'EVENT',
      payload: { eventIndex },
      timestamp: eventIndex + 1
    })
  }

  await pipePromisify(
    inputStorageAdapter.export(),
    outputStorageAdapter.import()
  )

  let outputCountEvents = 0
  await outputStorageAdapter.loadEvents({}, () => {
    outputCountEvents++
  })

  expect(outputCountEvents).toEqual(inputCountEvents)
})
