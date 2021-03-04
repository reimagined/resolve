import path from 'path'
import fs from 'fs'
import { promisify } from 'util'
import { pipeline } from 'stream'
import {
  MAINTENANCE_MODE_MANUAL,
  MAINTENANCE_MODE_AUTO,
} from '@resolve-js/eventstore-base'

import checkMaintenanceMode from '../utils/checkMaintenanceMode'

const eventStoreImportHandler = async (req, res) => {
  try {
    const { eventstoreAdapter } = req.resolve
    const { directory } = req.query

    checkMaintenanceMode(req.query.maintenanceMode)

    const maintenanceMode =
      req.query.maintenanceMode === 'manual'
        ? MAINTENANCE_MODE_MANUAL
        : MAINTENANCE_MODE_AUTO

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
      eventstoreAdapter.importEvents({
        maintenanceMode,
      })
    )

    await promisify(pipeline)(
      fs.createReadStream(secretsFile),
      eventstoreAdapter.importSecrets({
        maintenanceMode,
      })
    )

    res.end('ok')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(error)

    res.status(500)
    res.end(String(error))
  }
}

export default eventStoreImportHandler
