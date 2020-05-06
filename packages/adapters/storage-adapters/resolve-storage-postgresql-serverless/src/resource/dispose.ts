import {
  CloudResource,
  CloudResourceOptions,
  CloudResourcePool
} from '../types'

const dispose = async (
  pool: CloudResourcePool & CloudResource,
  options: CloudResourceOptions
): Promise<any> => {
  const { destroyResource, createResource } = pool

  await destroyResource(options)
  await createResource(options)
}

export default dispose
