import fs from 'fs'
import path from 'path'

import getMonorepoNodeModules from './get_monorepo_node_modules'

const getModulesDirs = ({ isAbsolutePath = false } = {}) => {
  const currentDir = process.cwd()

  const monorepoNodeModules = getMonorepoNodeModules()
  const currentDirNodeModules = path.join(currentDir, 'node_modules')
  const resolveRuntimeNodeModules = path.join(
    path.dirname(
      require.resolve('@resolve-js/runtime-base/package.json', {
        paths: [currentDirNodeModules, ...monorepoNodeModules],
      })
    ),
    'node_modules'
  )

  const absoluteDirs = []

  if (fs.existsSync(currentDirNodeModules)) {
    absoluteDirs.push(currentDirNodeModules)
  }
  if (fs.existsSync(resolveRuntimeNodeModules)) {
    absoluteDirs.push(resolveRuntimeNodeModules)
  }
  absoluteDirs.push(...monorepoNodeModules)

  if (isAbsolutePath) {
    return absoluteDirs
  } else {
    const relativeDirs = absoluteDirs.map((absoluteDir) =>
      path.relative(currentDir, absoluteDir)
    )

    return relativeDirs
  }
}

export default getModulesDirs
