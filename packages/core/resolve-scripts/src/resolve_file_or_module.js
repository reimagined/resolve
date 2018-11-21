import fs from 'fs'
import path from 'path'

import getMonorepoNodeModules from './get_monorepo_node_modules'

const resolveFileOrModule = (query, rewritePath = false) => {
  const customFilePath = path.resolve(process.cwd(), query)

  if (fs.existsSync(customFilePath)) {
    return customFilePath
  }

  try {
    const resolvedQuery = require.resolve(query, {
      paths: [
        path.resolve(process.cwd(), 'node_modules'),
        path.resolve(__dirname, '../node_modules'),
        ...getMonorepoNodeModules()
      ]
    })

    if (rewritePath) {
      return resolvedQuery
    }

    return query
  } catch (e) {}

  throw new Error(`File/module "${query}" does not exist`)
}

export default resolveFileOrModule
