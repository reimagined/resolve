import path from 'path'
import escapeRegExp from 'lodash.escaperegexp'

const normalizePaths = (source) => {
  const normalize = path.sep === '/' ? path.normalize : path.win32.normalize

  let monorepoPath = normalize(
    path.resolve(__dirname, normalize('../../../..'))
  )
  if (path.sep === '\\') {
    monorepoPath = monorepoPath.replace(
      new RegExp(escapeRegExp('\\'), 'gi'),
      '\\\\'
    )
  }

  let result = source.replace(
    new RegExp(escapeRegExp(monorepoPath), 'gi'),
    '<MONOREPO_DIR>'
  )
  if (path.sep === '\\') {
    result = result.replace(new RegExp(escapeRegExp('\\\\'), 'gi'), '/')
  }

  result = result.replace(
    /<MONOREPO_DIR>(.*)\/node_modules/g,
    '<MONOREPO_DIR>/node_modules'
  )

  return result
}

export default normalizePaths
