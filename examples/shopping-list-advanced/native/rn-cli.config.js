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


let reactNativeDir = path.dirname(require.resolve('react-native/package.json'))
if (fs.lstatSync(reactNativeDir).isSymbolicLink()) {
  reactNativeDir = fs.realpathSync(reactNativeDir);
}

const config = {
  resolver: {
    extraNodeModules: {
      'react-native': reactNativeDir
    },
    blacklistRE: blacklist(
      [
        /node_modules[/\\]react-native/,
      ]
    )
  },
  watchFolders: roots
}

module.exports = config
