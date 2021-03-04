import path from 'path'
import fs from 'fs'
import { promisify } from 'util'
import { pipeline } from 'stream'
import {
  MAINTENANCE_MODE_MANUAL,
  MAINTENANCE_MODE_AUTO,
} from '@resolve-js/eventstore-base'

import checkMaintenanceMode from '../utils/checkMaintenanceMode'

const eventStoreExportHandler = async (req, res) => {
  try {
    const { eventstoreAdapter } = req.resolve
    const { directory } = req.query

    checkMaintenanceMode(req.query.maintenanceMode)

    const maintenanceMode =
      req.query.maintenanceMode === 'manual'
        ? MAINTENANCE_MODE_MANUAL
        : MAINTENANCE_MODE_AUTO

    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory)
    }

    const eventsFile = path.join(directory, 'events.db')
    const secretsFile = path.join(directory, 'secrets.db')

    await promisify(pipeline)(
      eventstoreAdapter.exportEvents({
        maintenanceMode,
      }),
      fs.createWriteStream(eventsFile)
    )
    await promisify(pipeline)(
      eventstoreAdapter.exportSecrets({
        maintenanceMode,
      }),
      fs.createWriteStream(secretsFile)
    )

    res.end('ok')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(error)

    res.status(500)
    res.end(String(error))
  }
}

export default eventStoreExportHandler
