const core = require('@actions/core')
const { execSync } = require('child_process')

const deploymentId = core.getState('deployment_id')

try {
  console.debug(`removing cloud application ${deploymentId}`)
  execSync(`yarn --silent resolve-cloud remove ${deploymentId} --no-wait`, {
    stdio: 'inherit',
  })
} catch (error) {
  console.warn(error)
}
