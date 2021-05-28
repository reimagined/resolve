const minimist = require('minimist')
const { getRepoRoot } = require('./get-repo-root')

let _resolveDir
const getResolveDir = () => {
  if (_resolveDir) {
    return _resolveDir
  }

  const { resolveDir } = minimist(process.argv.slice(2))

  _resolveDir = resolveDir || getRepoRoot()

  return _resolveDir
}

module.exports = { getResolveDir }
