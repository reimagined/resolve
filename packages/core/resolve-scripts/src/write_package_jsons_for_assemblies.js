import fs from 'fs'
import path from 'path'

const writePackageJsonsForAssemblies = (distDir, nodeModulesByAssembly) => {
  const applicationPackageJson = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'package.json'))
  )

  const resolveScriptsPackageJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../package.json'))
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

    const assemblyPackageJson = {
      name: `${applicationPackageJson.name}-${syntheticName}`,
      private: true,
      version: applicationPackageJson.version,
      main: './index.js',
      dependencies: Array.from(nodeModules).reduce((acc, val) => {
        acc[val] = applicationPackageJson.dependencies[val]
        return acc
      }, {})
    }

    assemblyPackageJson.dependencies['resolve-runtime'] =
      resolveScriptsPackageJson.version

    fs.writeFileSync(
      absolutePackageJsonPath,
      JSON.stringify(assemblyPackageJson, null, 2)
    )
  }
}

export default writePackageJsonsForAssemblies
