#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const monorepoDir = path.join(__dirname, '..', '..', '..', '..')
const packageJsonPath = path.join(monorepoDir, 'package.json')

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

const [operation, workspace] = process.argv.slice(2)

const validateWorkspace = () => {
  if (workspace == null || workspace === '') {
    throw new Error('The "workspace" argument is required')
  }
}

switch (operation) {
  case 'add': {
    validateWorkspace()

    packageJson.workspaces.packages = packageJson.workspaces.packages
      .filter((name) => name !== workspace)
      .concat(workspace)

    break
  }
  case 'remove':
  case 'rm': {
    validateWorkspace()

    packageJson.workspaces.packages = packageJson.workspaces.packages.filter(
      (name) => name !== workspace
    )
    break
  }
  case 'cat': {
    // eslint-disable-next-line
    console.log(JSON.stringify(packageJson, null, 2))
    break
  }
  default: {
    throw new Error(`Unknown operation = "${operation}"`)
  }
}

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8')
