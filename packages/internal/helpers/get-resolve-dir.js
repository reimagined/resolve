const path = require('path')
const minimist = require('minimist')

let _resolveDir
const getResolveDir = () => {
  if (_resolveDir) {
    return _resolveDir
  }

  const { resolveDir } = minimist(process.argv.slice(2))

  _resolveDir = resolveDir || path.join(__dirname, '..', '..', '..')

  return _resolveDir
}

module.exports = { getResolveDir }
