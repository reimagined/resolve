const fs = require('fs')
const path = require('path')
const { getModulesDirs } = require('resolve-scripts')
const blacklist = require('metro-config/src/defaults/blacklist')

const roots = [
  path.join(__dirname),
  path.join(__dirname, '..'),
  path.join(__dirname, '..', 'ui'),
  path.join(__dirname, '..', 'utils')
]
roots.forEach(dir => {
  const nodeModules = path.resolve(dir, 'node_modules')
  if (fs.existsSync(nodeModules)) {
    roots.push(nodeModules)
  }
})
roots.push(...getModulesDirs({ isAbsolutePath: true }))

module.exports = {
  resolver: {
    extraNodeModules: {
      'react-native': path.dirname(require.resolve('react-native/package.json'))
    },
    blacklistRE: blacklist([/node_modules[/\\]react-native/])
  },
  watchFolders: roots
}
