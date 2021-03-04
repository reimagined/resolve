import fs from 'fs'
import path from 'path'

const getWebpackAlias = () => {
  const alias = {}

  for (const filename of fs.readdirSync(path.resolve(__dirname, 'alias'))) {
    if (path.extname(filename) !== '.js') {
      continue
    }
    alias[path.basename(filename, '.js')] = path.resolve(
      __dirname,
      'alias',
      filename
    )
  }

  return alias
}

export default getWebpackAlias
