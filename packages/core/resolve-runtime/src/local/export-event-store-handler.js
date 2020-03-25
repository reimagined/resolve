import path from 'path'
import fs from 'fs'
import { promisify } from 'util'

import { pipeline } from 'stream'

const exportEventStoreHandler = options => async (req, res) => {
  const { storageAdapter } = req.resolve

  try {
    const { exportFile } = options

    const eventStream = storageAdapter.export()
    const fsStream = fs.createWriteStream(path.join(exportFile))
    await promisify(pipeline)(eventStream, fsStream)

    res.end('ok')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error)
    res.status(500)
    res.end(String(error))
  }
}

export default exportEventStoreHandler
