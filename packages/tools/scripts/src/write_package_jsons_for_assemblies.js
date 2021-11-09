import fs from 'fs'
import path from 'path'
import semver from 'semver'

const resolvePackages = JSON.parse(process.env.__RESOLVE_PACKAGES__ ?? '')

const writePackageJsonsForAssemblies = (
  distDir,
  nodeModulesByAssembly,
  peerDependencies
) => {
  const applicationPackageJson = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), 'package.json'))
  )

  const resolvePackagesOwnPackageJsons = resolvePackages.map(pkg => require(`${pkg}/package.json`))

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
        if (applicationPackageJson.dependencies.hasOwnProperty(val)) {
          acc[val] = applicationPackageJson.dependencies[val]
        } else if (nodeModules.has(val)) {
          for(const ownPackageJson of resolvePackagesOwnPackageJsons) {
            if(ownPackageJson.dependencies?.hasOwnProperty(val)) {
              acc[val] =
              val.startsWith('@resolve-js/') && frameworkVersion != null
                ? frameworkVersion
                : ownPackageJson.dependencies[val]
              break
            }
          }
        }

        return acc
      }, {
        "@resolve-js/runtime": frameworkVersion
      }),
    }

    fs.writeFileSync(
      absolutePackageJsonPath,
      JSON.stringify(assemblyPackageJson, null, 2)
    )
  }
}

export default writePackageJsonsForAssemblies
