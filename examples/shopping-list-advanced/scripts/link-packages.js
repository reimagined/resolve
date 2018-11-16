const find = require('glob').sync
const path = require('path')
const { execSync } = require('child_process')


const monorepoRoot = path.join(__dirname, '..')

const namespaces = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies'
]

const localPackages = find(`${monorepoRoot}/*/package.json`)

const localPackagesNames = localPackages.map(
    localPackage => require(localPackage).name
)
//
// // Install
// for(const localPackage of localPackages) {
//   execSync('yarn --no-lockfile --registry="http://npm.resolve.sh:10080"', { cwd: path.dirname(localPackage), stdio: 'inherit' })
// }
//
localPackages.push(
  path.join(__dirname, '../../../packages/core/resolve-scripts/package.json'),
  path.join(__dirname, '../../../packages/core/resolve-redux/package.json')
)

localPackagesNames.push(
  'resolve-scripts',
  'resolve-redux'
)

// Create Links
for(const localPackage of localPackages) {
  try {
    
  
  execSync('yarn unlink', { cwd: path.dirname(localPackage), stdio: 'inherit' })
  } catch (e) {
    
  }
}

for(const localPackage of localPackages) {
  const packageJson = require(localPackage)
  for(const key of namespaces) {
    const dependencies = packageJson[key]
    if(!dependencies) {
      continue
    }
    for(const packageName of Object.keys(dependencies)) {
      if(localPackagesNames.includes(packageName)) {
        try {
        execSync(`yarn unlink ${packageName}`, { cwd: path.dirname(localPackage), stdio: 'inherit' })
        } catch (e) {
          
        }
      }
    }
  }
}

