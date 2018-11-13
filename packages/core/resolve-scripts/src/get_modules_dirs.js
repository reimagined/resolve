import path from 'path'

import getMonorepoNodeModules from './get_monorepo_node_modules'

const getModulesDirs = ({ isAbsolutePath = false } = {}) => {
  const currentDir = process.cwd()

  const currentDirNodeModules = path.resolve(currentDir, 'node_modules')
  const monorepoNodeModules = getMonorepoNodeModules()

  const absoluteDirs = [
    currentDirNodeModules,
    path.join(
      require.resolve('resolve-runtime', {
        paths: [currentDirNodeModules, ...monorepoNodeModules]
      }),
      '../node_modules'
    ),
    ...monorepoNodeModules
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
