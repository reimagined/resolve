import type { CurrentConnectMethod } from './types'

const connect: CurrentConnectMethod = async (imports, pool, options) => {
  const { targetApplicationUrl } = options

  Object.assign(pool, {
    targetApplicationUrl,
    ...imports,
  })
}

export default connect
