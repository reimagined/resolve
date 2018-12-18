import fs from 'fs'
import path from 'path'

import { includeAlias as excludeConstantAlias } from './$resolve.constants'

const excludeAlias = [
  'clientEntry',
  'hotModuleReplacement',
  'subscribeAdapter',
  'localEntry',
  'cloudEntry',
  'apiHandlers',
  'aggregates',
  'readModels',
  'viewModels',
  'sagas',
  'assemblies',
  'chunkReactNative',
  ...excludeConstantAlias
]

export default () => {
  const exports = []

  const alias = fs
    .readdirSync(__dirname)
    .filter(filename => path.extname(filename) === '.js')
    .map(filename => path.basename(filename, '.js').replace('$resolve.', ''))
    .filter(alias => !excludeAlias.includes(alias))

  for (const name of alias) {
    exports.push(`import ${name} from '$resolve.${name}'`)
  }

  exports.push(``, `export default {`, ` ${alias.join(',\r\n')}`, `}`)

  return {
    code: exports.join('\r\n')
  }
}
