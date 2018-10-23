const getWorkspaces = require('get-yarn-workspaces')
const path = require('path')

function getConfig(from) {
  const workspaces = getWorkspaces(from)
  
  const roots = [
    path.resolve(from),
    path.resolve(from, './', 'node_modules'),
  ].concat(workspaces)
  
  const config = {
    getProjectRoots: () => roots,
    watchFolders: roots
  }
  
  return config
}

module.exports = getConfig(__dirname)




