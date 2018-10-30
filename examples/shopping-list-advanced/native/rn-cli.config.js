const path = require('path')
const fs = require('fs')

const roots = [
  path.resolve(__dirname),
  path.resolve(__dirname, '..'),
  path.resolve(__dirname, '../ui'),
  path.resolve(__dirname, '../utils')
]
roots.forEach(dir => {
  const nodeModules = path.resolve(dir, 'node_modules')
  if (fs.existsSync(nodeModules)) {
    roots.push(nodeModules)
  }
})

const config = {
  getProjectRoots: () => roots,
  watchFolders: roots,
  resetCache: true
}

module.exports = config
