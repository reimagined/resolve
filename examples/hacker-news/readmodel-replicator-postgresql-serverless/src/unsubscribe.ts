import type { ExternalMethods } from './types'

const unsubscribe: ExternalMethods['unsubscribe'] = async (
  pool,
  readModelName
) => {
  const { dropReadModel } = pool

  await dropReadModel(pool, readModelName)
}

export default unsubscribe
