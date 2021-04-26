const { execSync } = require('child_process')
const { DepGraph } = require('dependency-graph')
const { readFileSync } = require('fs')
const path = require('path')
const { getRepoRoot } = require('./get-repo-root')
const repoRoot = getRepoRoot()

const workspaceFilter = (workspaces, name) => {
  const { location } = workspaces[name]
  const { private: internal } = JSON.parse(
    readFileSync(path.resolve(repoRoot, location, 'package.json')).toString()
  )
  return !internal
}

const makeBuildRegistry = (topology) =>
  topology
    .overallOrder()
    .map((name) => ({
      name,
      location: topology.getNodeData(name).location,
      dependencies: topology.directDependenciesOf(name),
    }))
    .sort((a, b) => a.dependencies.length - b.dependencies.length)

const getTopology = (filter) => {
  const workspaces = JSON.parse(
    execSync('yarn workspaces --silent info', { stdio: 'pipe' }).toString()
  )

  const topology = Object.keys(workspaces)
    .filter(workspaceFilter.bind(null, workspaces))
    .reduce((topology, name) => {
      const { workspaceDependencies: dependencies, location } = workspaces[name]
      if (topology.hasNode(name)) {
        topology.setNodeData(name, { dependencies, location })
      } else {
        topology.addNode(name, { dependencies, location })
      }
      dependencies.map((dependency) => {
        if (!topology.hasNode(dependency)) {
          topology.addNode(dependency)
        }
        topology.addDependency(name, dependency)
        return dependency
      })
      return topology
    }, new DepGraph())

  if (filter != null) {
    const singleNodeTopology = new DepGraph()
    const copyNode = (name) => {
      if (!singleNodeTopology.hasNode(name)) {
        singleNodeTopology.addNode(name, topology.getNodeData(name))
      }
      topology.directDependenciesOf(name).map((dependency) => {
        copyNode(dependency)
        singleNodeTopology.addDependency(name, dependency)
        return dependency
      })
    }
    copyNode(filter)
    return singleNodeTopology
  }

  return topology
}
const prepareBuildRegistry = (filter = null) =>
  makeBuildRegistry(getTopology(filter))

module.exports = {
  prepareBuildRegistry,
}
