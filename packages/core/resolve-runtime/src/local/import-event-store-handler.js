import path from 'path'
import fs from 'fs'
import { promisify } from 'util'

import { pipeline } from 'stream'

const importEventStoreHandler = (options) => async (req, res) => {
  const { eventstoreAdapter } = req.resolve

  try {
    const { importFile } = options

    const eventStream = eventstoreAdapter.import()
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
