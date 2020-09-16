const core = require('@actions/core')
const { execSync } = require('child_process')

const deploymentId = core.getState('deploymentId')
const cwd = core.getState('cwd')
const RESOLVE_API_URL = core.getState('RESOLVE_API_URL')

try {
  execSync(`yarn resolve-cloud remove ${deploymentId}`, {
    cwd,
    env: {
      RESOLVE_API_URL,
    },
    stdio: 'inherit',
  })
} catch (error) {
  console.warn(error)
}
