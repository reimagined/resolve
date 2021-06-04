import interopRequireDefault from '@babel/runtime/helpers/interopRequireDefault'
import debugLevels from '@resolve-js/debug-levels'
import path from 'path'

import liveEntryDir from './live-entry-dir'

const log = debugLevels('resolve:runtime:liveRequire')

let pureRequire
try {
  pureRequire = __non_webpack_require__ //eslint-disable-line no-undef
} catch (error) {
  pureRequire = require
}

const liveRequire = (filePath) => {
  const entryPointDirname = liveEntryDir()
  let resource = null
  const isRealFilePath = filePath[0] === '/' || filePath[0] === '.'

  if (isRealFilePath && entryPointDirname == null) {
    log.error('Entry point working directory recognition failed')
    return resource
  }

  const fullPath = isRealFilePath
    ? path.resolve(entryPointDirname, filePath)
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
