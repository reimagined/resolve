import path from 'path'
import fs from 'fs'
import { promisify } from 'util'

import { pipeline } from 'stream'

const importEventStoreHandler = options => async (req, res) => {
  const { storageAdapter } = req.resolve

  try {
    const { importFile } = options

    const eventStream = storageAdapter.import()
    const fsStream = fs.createReadStream(path.join(importFile))
    await promisify(pipeline)(fsStream, eventStream)

    res.end('ok')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error)
    res.status(500)
    res.end(String(error))
  }
}

export default importEventStoreHandler
