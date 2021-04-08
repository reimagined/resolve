import type { ExternalMethods } from './types'

const reset: ExternalMethods['reset'] = async (pool, readModelName) => {
  const { dropReadModel } = pool

  await dropReadModel(pool, readModelName)
}

export default reset
