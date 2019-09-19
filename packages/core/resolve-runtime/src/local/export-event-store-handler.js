import path from 'path'
import fs from 'fs'

import { pipeline } from 'resolve-storage-base'

const exportEventStoreHandler = options => async (req, res) => {
  const { storageAdapter } = req.resolve

  try {
    const { exportFile } = options

    const eventStream = storageAdapter.export()
    const fsStream = fs.createWriteStream(path.join(exportFile))
    await pipeline(eventStream, fsStream)

    res.end('ok')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error)
    res.status(500)
    res.end(String(error))
  }
}

export default exportEventStoreHandler
