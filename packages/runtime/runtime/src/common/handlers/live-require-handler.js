import debugLevels from '@resolve-js/debug-levels'

import liveRequire from '../dynamic-require/live-require'

const log = debugLevels('resolve:runtime:fail-handler')

const liveRequireHandler = (moduleOptions, imports) => async (req, res) => {
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

export default liveRequireHandler
