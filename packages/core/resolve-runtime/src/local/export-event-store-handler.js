import path from 'path'
import fs from 'fs'
import { promisify } from 'util'

import { pipeline } from 'stream'

const exportEventStoreHandler = (options) => async (req, res) => {
  const { eventstoreAdapter } = req.resolve

  try {
    const { directory } = options

    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory)
    }

    const eventsFile = path.join(directory, 'events.db')
    const secretsFile = path.join(directory, 'secrets.db')

    await promisify(pipeline)(
      eventstoreAdapter.exportEvents(),
      fs.createWriteStream(eventsFile)
    )
    await promisify(pipeline)(
      eventstoreAdapter.exportSecrets(),
      fs.createWriteStream(secretsFile)
    )

    res.end('ok')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error)
    res.status(500)
    res.end(String(error))
  }
}

export default exportEventStoreHandler
