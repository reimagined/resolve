import type { CurrentConnectMethod } from './types'

const connect: CurrentConnectMethod = async (imports, pool, options) => {
  const { targetApplicationUrl, preferRegularLoader } = options

  Object.assign(pool, {
    targetApplicationUrl,
    preferRegularLoader: !!preferRegularLoader,
    ...imports,
  })
}

export default connect
