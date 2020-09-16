const core = require('@actions/core')
const { execSync } = require('child_process')

const deploymentId = core.getState('deploy-action-deployment-id')
const appDir = core.getState('deploy-action-app-dir')

try {
  execSync(`resolve-cloud remove ${deploymentId}`, {
    cwd: appDir,
    stdio: 'inherit',
  })
} catch (error) {
  console.warn(error)
}
