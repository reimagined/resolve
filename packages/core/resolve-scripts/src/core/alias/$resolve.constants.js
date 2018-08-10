import fs from 'fs'
import path from 'path'

export const includeAlias = [
  'applicationName',
  'distDir',
  'jwtCookie',
  'port',
  'rootPath',
  'staticDir',
  'staticPath'
]

export default () => {
  const exports = []

  const alias = fs
    .readdirSync(__dirname)
    .filter(filename => path.extname(filename) === '.js')
    .map(filename => path.basename(filename, '.js').replace('$resolve.', ''))
    .filter(alias => includeAlias.includes(alias))

  for (const name of alias) {
    exports.push(`import ${name} from '$resolve.${name}'`)
  }

  exports.push(``, `export default {`, ` ${alias.join(',\r\n')}`, `}`)

  return {
    code: exports.join('\r\n')
  }
}
