import path from 'path'
import lodash from 'lodash'

const normalizePaths = source => {
  const monorepoPath = path.resolve(__dirname, '../../../..')
  return source.replace(
    new RegExp(lodash.escapeRegExp(monorepoPath), 'gi'),
    '<MONOREPO_DIR>'
  )
}

export default normalizePaths
