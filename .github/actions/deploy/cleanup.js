const core = require('@actions/core')
const { execSync } = require('child_process')

const deploymentId = core.getState('deployment_id')
const appDir = core.getState('app_dir')

try {
  console.debug(`removing cloud application ${deploymentId}`)
  execSync(`yarn --silent resolve-cloud remove ${deploymentId} --no-wait`, {
    cwd: appDir,
    stdio: 'inherit',
  })
} catch (error) {
  console.warn(error)
}
