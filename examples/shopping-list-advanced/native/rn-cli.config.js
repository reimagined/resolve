const getWorkspaces = require('get-yarn-workspaces')
const path = require('path')
const fs = require('fs')
const { getModulesDirs } = require('resolve-scripts')

const blacklist = require('metro-config/src/defaults/blacklist')

function getConfig(from) {
  // [ '/home/mrcheater/resolve/examples/shopping-list-advanced/domain',
  //   '/home/mrcheater/resolve/examples/shopping-list-advanced/ui',
  //   '/home/mrcheater/resolve/examples/shopping-list-advanced/utils',
  //   '/home/mrcheater/resolve/examples/shopping-list-advanced/web',
  //   '/home/mrcheater/resolve/examples/shopping-list-advanced/scripts',
  //   '/home/mrcheater/resolve/examples/shopping-list-advanced/native' ]

  const workspaces = [
    path.join(__dirname),
    path.join(__dirname, '..'),
    path.join(__dirname, '..', 'ui'),
    path.join(__dirname, '..', 'utils')
  ]

  const roots = [...workspaces]
  roots.forEach(dir => {
    const nodeModules = path.resolve(dir, 'node_modules')
    if (fs.existsSync(nodeModules)) {
      roots.push(nodeModules)
    }
  })
  roots.push(...getModulesDirs({ isAbsolutePath: true }))
  
  // const blacklistNodeModules = roots.map(
  //   dir => dir.replace(/[\/\\]node_modules$/gi, '')
  // ).map(
  //   modulePath =>
  //     `/${modulePath.replace(
  //       /\//g,
  //       '[/\\\\]'
  //     )}[/\\\\]node_modules[/\\\\]react-native[/\\\\].*/`
  // )
  // console.log('blacklistNodeModules')
  // console.log(blacklist(
  //   [
  //     /node_modules[/\\]react-native[/\\].*/
  //   ]
  //   //blacklistNodeModules
  // ))
  
  // console.log(path.join(__dirname, 'node_module', 'react-native'))
  // console.log(path.dirname(require.resolve('react-native/package.json')))
console.log(path.dirname(require.resolve('expo/package.json')))
  
  let reactNativeDir = path.dirname(require.resolve('react-native/package.json'))
  if (fs.lstatSync(reactNativeDir).isSymbolicLink()) {
    reactNativeDir = fs.realpathSync(reactNativeDir);
  }

  const config = {
    resolver: {
      // resolveRequest: (_,query) => {
      //   console.log(query)
      //   return require.resolve(query)
      // }
      extraNodeModules: {
        'react-native': reactNativeDir//path.dirname(require.resolve('react-native/package.json')), //path.join(__dirname, 'node_module', 'react-native')
      //  'expo': path.dirname(require.resolve('expo/package.json'))
      },
      blacklistRE: blacklist(
        [
          /node_modules[/\\]react-native/,
          // /node_modules[/\\]react-native[/\\].*/,
          // /node_modules[/\\]expo/,
          // /node_modules[/\\]expo[/\\].*/
        ]
        //blacklistNodeModules
      )
    },
    watchFolders: roots
  }

  return config
}

module.exports = getConfig(__dirname)
