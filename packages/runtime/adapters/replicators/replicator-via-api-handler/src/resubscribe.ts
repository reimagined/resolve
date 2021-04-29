import type { ExternalMethods } from './types'

const resubscribe: ExternalMethods['resubscribe'] = async (
  pool,
  readModelName
) => {
  const { dropReadModel } = pool

  await dropReadModel(pool, readModelName)
}

export default resubscribe
