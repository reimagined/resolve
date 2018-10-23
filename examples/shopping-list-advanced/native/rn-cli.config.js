const getWorkspaces = require('get-yarn-workspaces')
const path = require('path')
const fs = require('fs')
const { getModulesDirs } = require('resolve-scripts')

function getConfig(from) {
  const workspaces = getWorkspaces(from)
  
  const roots = [
    path.resolve(from, '..'),
    path.resolve(from)
  ].concat(workspaces)
  roots.forEach(
    dir => {
      const nodeModules = path.resolve(dir, 'node_modules')
      if(fs.existsSync(nodeModules)) {
        roots.push(nodeModules)
      }
    }
  )
  roots.push(...getModulesDirs({ isAbsolutePath: true }))
  
  console.log(roots)
  
  const config = {
    getProjectRoots: () => roots,
    watchFolders: roots
  }
  
  return config
}

module.exports = getConfig(__dirname)




