const core = require('@actions/core')
const { execSync } = require('child_process')

const deploymentId = core.getState('deployment_id')
const appDir = core.getState('app_dir')

try {
  execSync(`resolve-cloud remove ${deploymentId}`, {
    cwd: appDir,
    stdio: 'inherit',
  })
} catch (error) {
  console.warn(error)
}
