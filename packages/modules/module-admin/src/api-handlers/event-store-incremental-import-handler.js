import fs from 'fs'
import readLine from 'readline'

const eventStoreImportHandler = async (req, res) => {
  try {
    const { eventstoreAdapter } = req.resolve
    const { path: eventStorePath } = req.query

    if (!fs.existsSync(eventStorePath)) {
      throw new Error(`No such file "${eventStorePath}"`)
    }

    try {
      await eventstoreAdapter.rollbackIncrementalImport()
    } catch (e) {}

    const importId = await eventstoreAdapter.beginIncrementalImport()

    const inStreamToPush = fs.createReadStream(eventStorePath)

    const applyingEventsContent = []
    const applyingEventsCumulativeSizes = []
    let batchPushPromises = []

    const syncPromises = []

    const readByLine = readLine.createInterface({ input: inStreamToPush })
    const errors = []
    syncPromises.push(new Promise((resolve) => readByLine.on('close', resolve)))

    const oneTimePush = async (events) => {
      await eventstoreAdapter.pushIncrementalImport(events, importId)
    }

    readByLine.on('line', async (line) => {
      try {
        applyingEventsContent.push(JSON.parse(line))
        applyingEventsCumulativeSizes.push(
          (applyingEventsCumulativeSizes.length > 0
            ? applyingEventsCumulativeSizes[
                applyingEventsCumulativeSizes.length - 1
              ]
            : 0) + line.length
        )
      } catch (error) {
        errors.push(error)
        readByLine.close()
        return
      }

      if (
        applyingEventsCumulativeSizes[
          applyingEventsCumulativeSizes.length - 1
        ] <= 10000
      ) {
        return
      }
      const [slicedSize, spliceIdx] = applyingEventsCumulativeSizes.reduce(
        ([sum, lastIdx, stop], val, idx) =>
          sum + val > 10000 || stop
            ? [sum, lastIdx, true]
            : [sum + val, idx, stop],
        [0, -1, false]
      )
      if (spliceIdx < 0) {
        errors.push(new Error('Big size event'))
        readByLine.close()
        return
      }
      const pushingEvents = applyingEventsContent.splice(0, spliceIdx + 1)
      applyingEventsCumulativeSizes.splice(0, spliceIdx + 1)
      for (let idx = 0; idx < applyingEventsCumulativeSizes.length; idx++) {
        applyingEventsCumulativeSizes[idx] -= slicedSize
      }

      batchPushPromises.push(
        Promise.resolve()
          .then(oneTimePush.bind(null, pushingEvents))
          .catch((error) => {
            errors.push(error)
            readByLine.close()
          })
      )

      if (batchPushPromises.length > 16) {
        readByLine.pause()
        syncPromises.push(Promise.all(batchPushPromises))
        batchPushPromises = []
        await syncPromises[syncPromises.length - 1]
        readByLine.resume()
      }
    })

    await Promise.all(syncPromises)

    if (batchPushPromises.length > 0) {
      await Promise.all(batchPushPromises)
    }

    try {
      await oneTimePush(applyingEventsContent)
    } catch (error) {
      errors.push(error)
    }

    if (errors.length > 0) {
      const error = new Error(errors.map((err) => err.message).join('\n'))
      error.stack = errors.map((err) => err.stack).join('\n')
      throw error
    }

    await eventstoreAdapter.commitIncrementalImport(importId, true)

    res.end('ok')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(error)

    res.status(500)
    res.end(String(error))
  }
}

export default eventStoreImportHandler
