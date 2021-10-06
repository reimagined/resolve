import fs from 'fs'
import { execSync } from 'child_process'
import path from 'path'
import semver from 'semver'

const getWorkspacePackageJsons = () => {
  const workspaces = JSON.parse(
    execSync('yarn workspaces --silent info', { stdio: 'pipe' }).toString()
  )

  const packageJsons = Object.keys(workspaces).map((key) => {
    return JSON.parse(
      fs
        .readFileSync(
          path.resolve('../../../', workspaces[key].location, 'package.json') //FIXME: get workspace root correctly
        )
        .toString()
    )
  })

  return packageJsons
}

const getDependencyVersions = () => {
  return getWorkspacePackageJsons()
    .map((p) => p.dependencies)
    .filter((d) => !!d)
    .reduce((result, dependencies) => {
      for (const [packageName, version] of Object.entries(dependencies)) {
        if (!result.has(packageName)) {
          result.set(packageName, new Set([version]))
        } else {
          result.get(packageName).add(version)
        }
      }
      return result
    }, new Map())
}

const writePackageJsonsForAssemblies = (
  distDir,
  nodeModulesByAssembly,
  peerDependencies
) => {
  const dependencyVersions = getDependencyVersions()

  const applicationPackageJson = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), 'package.json'))
  )

  const resolveRuntimePackageJson = require('@resolve-js/runtime-base/package.json')

  for (const [
    packageJsonPath,
    nodeModules,
  ] of nodeModulesByAssembly.entries()) {
    const absolutePackageJsonPath = path.resolve(
      process.cwd(),
      distDir,
      packageJsonPath
    )

    const syntheticName = packageJsonPath
      .replace('/package.json', '')
      .replace(/[^\w\d-]/g, '-')

    const resultNodeModules = new Set([
      ...Array.from(nodeModules),
      ...Array.from(peerDependencies),
    ])

    const frameworkVersions = Array.from(
      new Set(
        Object.entries(applicationPackageJson.dependencies)
          .filter(([dependency]) => dependency.startsWith('@resolve-js/'))
          .map(([, version]) => {
            const parsedVersion = semver.parse(version)
            return parsedVersion != null ? version : null
          })
      )
    )

    if (frameworkVersions.length === 0) {
      throw new Error('package.json does not includes any framework packages')
    }

    if (frameworkVersions.length > 1) {
      throw new Error(
        `reSolve version is ${frameworkVersions[0]}, but expected ${frameworkVersions[1]}`
      )
    }

    const frameworkVersion = frameworkVersions[0]

    const assemblyPackageJson = {
      name: `${applicationPackageJson.name}-${syntheticName}`,
      private: true,
      version: applicationPackageJson.version,
      main: './index.js',
      dependencies: Array.from(resultNodeModules).reduce((acc, val) => {
        if (
          applicationPackageJson.dependencies.hasOwnProperty(val) &&
          !val.startsWith('@resolve-js')
        ) {
          acc[val] = applicationPackageJson.dependencies[val]
        } else if (nodeModules.has(val) && dependencyVersions.has(val)) {
          if (!val.startsWith('@resolve-js') && !val.startsWith('$resolve')) {
            const versionSet = dependencyVersions.get(val)
            if (!versionSet) {
              //TODO: decide what to do in this case
              throw Error(
                `Cannot determine version for the '${val}' dependency`
              )
            }
            if (versionSet.size > 1) {
              //TODO: decide what to do in this case
              // throw Error(
              //   `Multiple versions found for the '${val}' dependency: ${[
              //     ...versionSet,
              //   ].join(', ')}`
              // )
            }
            const [dependencyVersion] = [...versionSet]
            acc[val] = dependencyVersion
          }
        }
        return acc
      }, {}),
    }

    fs.writeFileSync(
      absolutePackageJsonPath,
      JSON.stringify(assemblyPackageJson, null, 2)
    )
  }
}

export default writePackageJsonsForAssemblies
