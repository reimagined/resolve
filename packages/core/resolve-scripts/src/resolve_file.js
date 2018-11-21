import fs from 'fs'
import path from 'path'
import getMonorepoNodeModules from './get_monorepo_node_modules'

const resolveFile = (query, fallbackQuery) => {
  try {
    const customFilePath = path.resolve(process.cwd(), query)

    if (fs.existsSync(customFilePath)) {
      return customFilePath
    }
  } catch (e) {}

  // TODO
  try {
    require.resolve(query, {
      paths: [
        path.resolve(process.cwd(), 'node_modules'),
        path.resolve(__dirname, '../node_modules'),
        ...getMonorepoNodeModules()
      ]
    })

    return query
  } catch (e) {}

  if (fallbackQuery) {
    return resolveFile(fallbackQuery)
  }

  throw new Error(`File "${query}" does not exist`)
}

export default resolveFile
