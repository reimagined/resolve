import fs from 'fs'
import { execSync } from 'child_process'
import path from 'path'
import semver from 'semver'
import findWorkspaceRoot from 'find-yarn-workspace-root'

const getWorkspacePackageJsons = () => {
  const workspaces = JSON.parse(
    execSync('yarn workspaces --silent info', { stdio: 'pipe' }).toString()
  )
  const workspaceRoot = findWorkspaceRoot(__dirname)
  if (!workspaceRoot) {
    return []
  }

  const packageJsons = Object.keys(workspaces).map((key) => {
    return JSON.parse(
      fs
        .readFileSync(
          path.resolve(workspaceRoot, workspaces[key].location, 'package.json')
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
  const applicationPackageJson = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), 'package.json'))
  )

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

    const dependencyVersions = getDependencyVersions()

    const assemblyPackageJson = {
      name: `${applicationPackageJson.name}-${syntheticName}`,
      private: true,
      version: applicationPackageJson.version,
      main: './index.js',
      dependencies: Array.from(resultNodeModules).reduce(
        (result, dependencyName) => {
          if (
            applicationPackageJson.dependencies.hasOwnProperty(
              dependencyName
            ) &&
            !dependencyName.startsWith('@resolve-js')
          ) {
            result[dependencyName] =
              applicationPackageJson.dependencies[dependencyName]
          } else if (
            nodeModules.has(dependencyName) &&
            dependencyVersions.has(dependencyName)
          ) {
            if (
              !dependencyName.startsWith('@resolve-js') &&
              !dependencyName.startsWith('$resolve')
            ) {
              const versionSet = dependencyVersions.get(dependencyName)
              if (!versionSet) {
                throw Error(
                  `Cannot determine version for the '${dependencyName}' dependency`
                )
              }
              if (versionSet.size > 1) {
                throw Error(
                  `Multiple versions found for the '${dependencyName}' dependency: ${[
                    ...versionSet,
                  ].join(', ')}`
                )
              }
              const [dependencyVersion] = [...versionSet]
              result[dependencyName] = dependencyVersion
            }
          }
          return result
        },
        {}
      ),
    }

    fs.writeFileSync(
      absolutePackageJsonPath,
      JSON.stringify(assemblyPackageJson, null, 2)
    )
  }
}

export default writePackageJsonsForAssemblies
