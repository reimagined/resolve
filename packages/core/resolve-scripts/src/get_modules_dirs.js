import path from 'path'

import getMonorepoNodeModules from './get_monorepo_node_modules'

const getModulesDirs = ({ isAbsolutePath = false } = {}) => {
  const currentDir = process.cwd()

  const absoluteDirs = [
    path.resolve(currentDir, 'node_modules'),
    path.resolve(__dirname, '../../node_modules'),
    ...getMonorepoNodeModules()
  ]

  if (isAbsolutePath) {
    return absoluteDirs
  } else {
    const relativeDirs = absoluteDirs.map(absoluteDir =>
      path.relative(currentDir, absoluteDir)
    )

    return relativeDirs
  }
}

export default getModulesDirs
