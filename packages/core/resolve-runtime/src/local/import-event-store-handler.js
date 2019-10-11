import path from 'path'
import fs from 'fs'

import { pipeline } from 'resolve-storage-base'

const importEventStoreHandler = options => async (req, res) => {
  const { storageAdapter } = req.resolve

  try {
    const { importFile } = options

    const eventStream = storageAdapter.import()
    const fsStream = fs.createReadStream(path.join(importFile))
    await pipeline(fsStream, eventStream)

    res.end('ok')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error)
    res.status(500)
    res.end(String(error))
  }
}

export default importEventStoreHandler
