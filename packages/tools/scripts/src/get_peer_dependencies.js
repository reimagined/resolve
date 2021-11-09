import { sync as find } from 'glob'
import fs from 'fs'
import path from 'path'

import getMonorepoNodeModules from './get_monorepo_node_modules'
const resolvePackages = JSON.parse(process.env.__RESOLVE_PACKAGES__ ?? '')

const getPeerDependencies = () => {
  const peerDependencies = new Set()

  const packageJsonPaths = Array.from(
    [
      path.resolve(process.cwd(), 'node_modules'),
      path.resolve(__dirname, '../node_modules'),
      ...getMonorepoNodeModules(),
    ]
      .map((dir) => find(`${dir}/**/package.json`))
      .reduce((acc, foundPackages) => {
        foundPackages.forEach((packageJsonPath) => acc.add(packageJsonPath))
        return acc
      }, new Set())
  )

  for (const packageJsonPath of packageJsonPaths) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath))

      if (packageJson.peerDependencies != null) {
        for (const peerDependency of Object.keys(
          packageJson.peerDependencies
        )) {
          if(resolvePackages.indexOf(peerDependency) < 0) {
            peerDependencies.add(peerDependency)
          }
        }
      }
    } catch (error) {}
  }

  return peerDependencies
}

export default getPeerDependencies
