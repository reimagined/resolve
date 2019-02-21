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

  for (const [
    packageJsonPath,
    nodeModules
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
      ...Array.from(peerDependencies)
    ])

    const assemblyPackageJson = {
      name: `${applicationPackageJson.name}-${syntheticName}`,
      private: true,
      version: applicationPackageJson.version,
      main: './index.js',
      dependencies: Array.from(resultNodeModules).reduce((acc, val) => {
        acc[val] = applicationPackageJson.dependencies[val]
        return acc
      }, {})
    }

    if (assemblyPackageJson.dependencies['resolve-runtime'] == null) {
      throw new Error(
        'Error in package.json. Incorrect "resolve-runtime" version'
      )
    }

    fs.writeFileSync(
      absolutePackageJsonPath,
      JSON.stringify(assemblyPackageJson, null, 2)
    )
  }
}

export default writePackageJsonsForAssemblies
