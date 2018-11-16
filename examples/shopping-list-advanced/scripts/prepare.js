const find = require('glob').sync
const path = require('path')
const { execSync } = require('child_process')

const monorepoRoot = path.join(__dirname, '..')

const localPackages = find(`${monorepoRoot}/*/package.json`)

// Install
for(const localPackage of localPackages) {
  execSync('yarn --no-lockfile', { cwd: path.dirname(localPackage), stdio: 'inherit' })
}
