import path from 'path'
import fs from 'fs'

import getMonorepoNodeModules from './get_monorepo_node_modules'

export default function resolveFileOrModule(query) {
  try {
    return require.resolve(query, {
      paths: [
        ...getMonorepoNodeModules(),
        path.resolve(process.cwd(), 'node_modules'),
        path.resolve(__dirname, '../../node_modules')
      ]
    })
  } catch (e) {}

  const customFilePath = path.resolve(process.cwd(), query)

  if (fs.existsSync(customFilePath)) {
    return customFilePath
  }

  throw new Error(`File/module "${query}" does not exist`)
}
