import fs from 'fs'
import path from 'path'

import getMonorepoNodeModules from './get_monorepo_node_modules'

const resolveFileOrModule = query => {
  const customFilePath = path.resolve(process.cwd(), query)

  if (fs.existsSync(customFilePath)) {
    return customFilePath
  }

  try {
    return require.resolve(query, {
      paths: [
        path.resolve(process.cwd(), 'node_modules'),
        path.resolve(__dirname, '../../node_modules'),
        ...getMonorepoNodeModules()
      ]
    })
  } catch (e) {}

  throw new Error(`File/module "${query}" does not exist`)
}

export default resolveFileOrModule
