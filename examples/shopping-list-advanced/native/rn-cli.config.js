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

  const roots = workspaces
  roots.forEach(dir => {
    const nodeModules = path.resolve(dir, 'node_modules')
    if (fs.existsSync(nodeModules)) {
      roots.push(nodeModules)
    }
  })
  roots.push(...getModulesDirs({ isAbsolutePath: true }))

  console.log(getModulesDirs({ isAbsolutePath: true }))

  console.log('roots')
  console.log(roots)
  console.log('workspaces')
  console.log(workspaces)

  const config = {
    resolver: {
      extraNodeModules: {
        'react-native': path.join(__dirname, 'node_module', 'react-native')
      },
      blacklistRE: blacklist(
        workspaces.map(
          modulePath =>
            `/${modulePath.replace(
              /\//g,
              '[/\\\\]'
            )}[/\\\\]node_modules[/\\\\]react-native[/\\\\].*/`
        )
      )
    },
    watchFolders: roots
  }

  return config
}

module.exports = getConfig(__dirname)
