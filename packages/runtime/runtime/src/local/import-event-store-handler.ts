import path from 'path'
import fs from 'fs'
import { promisify } from 'util'

import { pipeline } from 'stream'
import type { ResolveRequest, ResolveResponse } from '../common/types'

const importEventStoreHandler = (options: { directory: string }) => async (
  req: ResolveRequest,
  res: ResolveResponse
) => {
  const { eventstoreAdapter } = req.resolve

  try {
    const { directory } = options

    const eventsFile = path.join(directory, 'events.db')
    const secretsFile = path.join(directory, 'secrets.db')

    if (!fs.existsSync(eventsFile)) {
      throw new Error(`No such file or directory "${eventsFile}"`)
    }

    if (!fs.existsSync(secretsFile)) {
      throw new Error(`No such file or directory "${secretsFile}"`)
    }

    await promisify(pipeline)(
      fs.createReadStream(eventsFile),
      eventstoreAdapter.importEvents()
    )

    await promisify(pipeline)(
      fs.createReadStream(secretsFile),
      eventstoreAdapter.importSecrets()
    )

    res.end('ok')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error)
    res.status(500)
    res.end(String(error))
  }
}

export default importEventStoreHandler
