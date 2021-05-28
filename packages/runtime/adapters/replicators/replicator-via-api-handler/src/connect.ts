import type { CurrentConnectMethod } from './types'

const connect: CurrentConnectMethod = async (imports, pool, options) => {
  let { targetApplicationUrl } = options

  if (
    targetApplicationUrl == null ||
    targetApplicationUrl.constructor !== String
  ) {
    throw new Error(`Wrong application url: ${targetApplicationUrl}`)
  }

  Object.assign(pool, {
    targetApplicationUrl,
    ...imports,
  })
}

export default connect
