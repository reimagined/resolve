const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const find = require('glob').sync

const resolveScriptsPath = path.join(path.dirname(require.resolve('resolve-scripts')), '..')
const resolveReduxPath = path.join(path.dirname(require.resolve('resolve-redux')), '..')
const shoppingListPath = path.join(__dirname, '..')
const shoppingListNodeModulesPath = path.join(shoppingListPath, 'node_modules')

try {
  fs.mkdirSync(shoppingListNodeModulesPath)
} catch (e) {}

const localPackages = find(`${shoppingListPath}/*/package.json`)

const resolvePackages = ['resolve-scripts', 'resolve-redux']

for(const localPackagePath of localPackages) {
  const packageJson = JSON.parse(fs.readFileSync(localPackagePath))
  
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
          packageJson[namespace][packageName] = 'nightly'
        }
      }
    }
  }
  
  fs.writeFileSync(localPackagePath, JSON.stringify(packageJson, null, 2))
}

execSync(`yarn --registry="http://npm.resolve.sh:10080"`, { cwd: shoppingListPath, stdio: 'inherit' })
