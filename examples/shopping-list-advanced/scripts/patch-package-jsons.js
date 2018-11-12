const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const find = require('glob').sync

const resolveScriptsPath = path.join(path.dirname(require.resolve('resolve-scripts')), '..')
const resolveReduxPath = path.join(path.dirname(require.resolve('resolve-redux')), '..')
const shoppingListPath = path.join(__dirname, '..')
const shoppingListNodeModulesPath = path.join(shoppingListPath, 'node_modules')

console.log(resolveScriptsPath)
console.log(resolveReduxPath)
console.log(shoppingListPath)

try {
  fs.mkdirSync(shoppingListNodeModulesPath)
} catch (e) {}

execSync(`yarn pack --filename="${
  path.join(shoppingListNodeModulesPath, 'resolve-scripts.tgz')
}"`, { cwd: resolveScriptsPath })

execSync(`yarn pack --filename="${
  path.join(shoppingListNodeModulesPath, 'resolve-redux.tgz')
}"`, { cwd: resolveReduxPath })

const localPackages = find(`${shoppingListPath}/*/package.json`).map(
  filePath => path.dirname(filePath)
)

const resolvePackages = ['resolve-scripts', 'resolve-redux']

for(const localPackagePath of localPackages) {
  const packageJson = fs.readFileSync(localPackagePath)
  
  
  const namespaces = [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies'
  ]
  
  for (const namespace of namespaces) {
    if (packageJson[namespace]) {
      for (const packageName of Object.keys(packageJson[namespace])) {
        if (resolvePackages.includes(packageName)) {
          packageJson[namespace][packageName] =
            path.join(shoppingListNodeModulesPath, `${packageName}.tgz`)
        }
      }
    }
  }
  
  fs.writeFileSync(localPackagePath, JSON.stringify(packageJson, null, 2))
}
