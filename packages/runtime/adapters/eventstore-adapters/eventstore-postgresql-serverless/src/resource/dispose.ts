import getLog from '../get-log'
import {
  CloudResource,
  CloudResourceOptions,
  CloudResourcePool,
} from '../types'

const dispose = async (
  pool: CloudResourcePool & CloudResource,
  options: CloudResourceOptions
): Promise<void> => {
  const log = getLog(`resource:dispose`)

  const { destroyResource, createResource } = pool

  log.debug(`destroying the resource`)
  await destroyResource(options)

  log.debug(`re-creating the resource`)
  await createResource(options)

  log.debug(`resource disposed successfully`)
}

export default dispose
