import debugLevels from '@resolve-js/debug-levels'

import liveRequire from '../dynamic-require/live-require'
import type { ResolveRequest, ResolveResponse } from '../types'

const log = debugLevels('resolve:runtime:live-require-handler')

export const liveRequireHandler = (moduleOptions: any, imports: any) => async (
  req: ResolveRequest,
  res: ResolveResponse
) => {
  try {
    const {
      modulePath,
      moduleFactoryImport = false,
      ...options
    } = moduleOptions
    const resource = liveRequire(modulePath)
    if (typeof resource !== 'function') {
      throw new Error(`Runtime-import function from "${modulePath}" failed`)
    }

    const handler = moduleFactoryImport ? resource(options, imports) : resource

    return await handler(req, res)
  } catch (error) {
    const errorText = error != null ? error.message : 'Live handler error'

    await res.status(500)
    await res.end(errorText)

    log.warn(errorText)
  }
}
