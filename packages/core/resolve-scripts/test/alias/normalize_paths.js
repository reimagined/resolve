import path from 'path'
import escapeRegExp from 'lodash.escaperegexp'

const normalizePaths = source => {
  const monorepoPath = path.resolve(__dirname, '../../../..')
  return source.replace(
    new RegExp(escapeRegExp(monorepoPath), 'gi'),
    '<MONOREPO_DIR>'
  )
}

export default normalizePaths
