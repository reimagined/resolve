const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const localPackages = fs
  .readdirSync(path.join(__dirname, '..'))
  .filter(directory => {
    try {
      require(path.join(__dirname, '..', directory, 'package.json'))
      return true
    } catch (e) {
      return false
    }
  })
  .map(directory => ({
    name: require(path.join(__dirname, '..', directory, 'package.json')).name,
    directory: path.join(__dirname, '..', directory)
  }))

for (const { directory } of localPackages) {
  // eslint-disable-next-line no-console
  console.log(`${directory}> yarn test`)
  execSync('yarn test', { stdio: 'inherit', cwd: directory })
}
