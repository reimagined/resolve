import fs from 'fs'
import path from 'path'

const writePackageJsonsForAssemblies = (
  distDir,
  nodeModulesByAssembly,
  peerDependencies
) => {
  const applicationPackageJson = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), 'package.json'))
  )

  const resolveRuntimePackageJson = require('@resolve-js/runtime/package.json')

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

    const assemblyPackageJson = {
      name: `${applicationPackageJson.name}-${syntheticName}`,
      private: true,
      version: applicationPackageJson.version,
      main: './index.js',
      dependencies: Array.from(resultNodeModules).reduce((acc, val) => {
        if (applicationPackageJson.dependencies.hasOwnProperty(val)) {
          acc[val] = applicationPackageJson.dependencies[val]
        } else if (
          resolveRuntimePackageJson.dependencies.hasOwnProperty(val) &&
          nodeModules.has(val)
        ) {
          acc[val] = resolveRuntimePackageJson.dependencies[val]
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
