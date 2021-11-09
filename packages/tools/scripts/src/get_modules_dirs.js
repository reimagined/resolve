import fs from 'fs'
import path from 'path'

import getMonorepoNodeModules from './get_monorepo_node_modules'
const resolvePackages = JSON.parse(process.env.__RESOLVE_PACKAGES__ ?? '')

const getModulesDirs = ({ isAbsolutePath = false } = {}) => {
  const currentDir = process.cwd()
  const monorepoNodeModules = getMonorepoNodeModules()
  const currentDirNodeModules = path.join(currentDir, 'node_modules')
  const resolvePackagesNodeModulesList = resolvePackages.map(pkg =>
    path.join(
      path.dirname(
        require.resolve(`${pkg}/package.json`, {
          paths: [currentDirNodeModules, ...monorepoNodeModules],
        })
      ),
      'node_modules'
    )
  )
  
  const absoluteDirs = []

  if (fs.existsSync(currentDirNodeModules)) {
    absoluteDirs.push(currentDirNodeModules)
  }
  for(const packageNodeModulesDir of resolvePackagesNodeModulesList) {
    if (fs.existsSync(packageNodeModulesDir)) {
      absoluteDirs.push(packageNodeModulesDir)
    }
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
