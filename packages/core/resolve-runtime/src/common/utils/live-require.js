import interopRequireDefault from '@babel/runtime/helpers/interopRequireDefault'
import debugLevels from 'resolve-debug-levels'
import path from 'path'

const log = debugLevels('resolve:resolve-runtime:liveRequire')

const pureRequire = __non_webpack_require__ //eslint-disable-line no-undef
const entryPointDirname = (
  Object.values(pureRequire.cache).find(({ parent }) => parent == null) || {}
).filename

const liveRequire = filePath => {
  let resource = null
  const isRealFilePath = filePath[0] === '/' || filePath[0] === '.'

  if (isRealFilePath && entryPointDirname == null) {
    log.error('Entry point working directory recognition failed')
    return resource
  }

  const fullPath = isRealFilePath
    ? path.resolve(path.dirname(entryPointDirname), filePath)
    : filePath

  try {
    resource = interopRequireDefault(pureRequire(fullPath)).default
  } catch (error) {
    log.error('Live require failed:', error)
  }

  try {
    delete pureRequire.cache[pureRequire.resolve(filePath)]
  } catch (e) {}

  return resource
}

export default liveRequire
