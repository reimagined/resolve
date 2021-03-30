const { execSync } = require('child_process')
const { DepGraph } = require('dependency-graph')
const { readFileSync } = require('fs')
const intersection = require('lodash.intersection')
const difference = require('lodash.difference')
const uniq = require('lodash.uniq')
const path = require('path')
const repoRoot = path.resolve(__dirname, '../../..')

const workspaceFilter = (workspaces, name) => {
  const { location } = workspaces[name]
  const { private: internal } = JSON.parse(
    readFileSync(path.resolve(repoRoot, location, 'package.json')).toString()
  )
  return !internal
}

const buildTree = (topology, name) => {
  const dependents = topology
    .directDependentsOf(name)
    .filter(
      (candidate, index, source) =>
        intersection(topology.directDependenciesOf(candidate), source)
          .length === 0
    )
  return {
    name,
    dependents: dependents.map((dep) => buildTree(topology, dep)),
  }
}

const getRoots = (topology, name) => {
  const dependencies = topology.directDependenciesOf(name)
  const roots = dependencies.filter(
    (dependency) => topology.directDependenciesOf(dependency).length === 0
  )
  return uniq(
    roots.concat(
      ...difference(dependencies, roots).map((dependency) =>
        getRoots(topology, dependency)
      )
    )
  )
}

const getRepoTopology = () => {
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
      })
      return topology
    }, new DepGraph())

  //console.log(topology.directDependentsOf('@resolve-js/core'))
  //console.log(getRoots(topology, '@resolve-js/eventstore-postgresql'))

  const roots = uniq(
    topology.entryNodes().flatMap((name) => getRoots(topology, name))
  )

  console.log(roots)

  const trees = roots.map((name) => buildTree(topology, name))

  //console.log(topology.directDependentsOf('@resolve-js/client'))
  //console.log(topology.directDependentsOf('@resolve-js/react-hooks'))
}

getRepoTopology()

//module.exports = {
//  getRepoTopology,
//}
