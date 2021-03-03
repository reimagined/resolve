import debugLevels from '@resolve-js/debug-levels'

const log = debugLevels('resolve:runtime:fail-handler')

const failHandler = async (req, res) => {
  const errorText = `Access error: ${req.method} "${req.path}" is not addressable by current executor`
  await res.status(405)
  await res.end(errorText)
  log.warn(errorText)
}

export default failHandler
