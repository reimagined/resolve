import path from 'path'
import fs from 'fs'
import { promisify } from 'util'

import { pipeline } from 'stream'
import type { ResolveRequest, ResolveResponse } from '../common/types'

export const exportEventStoreHandler = (options: {
  directory: string
}) => async (req: ResolveRequest, res: ResolveResponse) => {
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
