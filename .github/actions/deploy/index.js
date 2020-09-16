const { execSync } = require('child_process')

execSync('npm install @actions/core')

const core = require('@actions/core')
const fs = require('fs')
const path = require('path')
const Url = require('url')

try {
  const cwd = path.isAbsolute(core.getInput('CWD'))
    ? core.getInput('CWD')
    : path.join(process.cwd(), core.getInput('CWD'))
  const deploymentEnvsFile = core.getInput('DEPLOYMENT_ENVS_FILE')
  const customPort = core.getInput('PORT')
  const customArgs = core.getInput('CUSTOM_ARGS')
  const RESOLVE_API_URL = core.getInput('RESOLVE_API_URL')

  const output = execSync(`yarn resolve-cloud deploy ${customArgs}`, {
    cwd,
    env: {
      RESOLVE_API_URL,
    },
  })

  const deploymentUrl = output.toString().match(/https?:\/\/.*/)[0]

  if (deploymentUrl == null) {
    throw new Error('Deployment URL is not found')
  }

  let { host, port, protocol } = Url.parse(deploymentUrl)

  if (host == null) {
    throw new Error('Deployment HOST is not found')
  }

  if (port == null && protocol === 'https:') {
    port = 443
  } else if (port == null && protocol === 'http:') {
    port = 80
  } else if (port == null) {
    throw new Error(`Invalid protocol ${protocol} for unknown port`)
  }
  if (customPort != null && customPort !== '') {
    port = customPort
  }

  const deploymentId = host.split('.')[0]

  if (deploymentId == null) {
    throw new Error('Deployment ID is not found')
  }

  const envs = []

  console.log(`Deployment ID = ${deploymentId}`)
  envs.push(`export DEPLOYMENT_ID=${deploymentId}`)

  console.log(`Deployment URL = ${deploymentUrl}`)
  envs.push(`export DEPLOYMENT_URL=${deploymentUrl}`)

  console.log(`Deployment URL Host = ${host}`)
  envs.push(`export DEPLOYMENT_HOST=${host}`)
  envs.push(`export HOST=${host}`)

  console.log(`Deployment URL Port = ${port}`)
  envs.push(`export DEPLOYMENT_PORT=${port}`)
  envs.push(`export PORT=${port}`)

  fs.writeFileSync(deploymentEnvsFile, envs.join('\n'))

  core.saveState('deploymentId', deploymentId)
  core.saveState('cwd', cwd)
  core.saveState('RESOLVE_API_URL', RESOLVE_API_URL)

  execSync('sleep 10')
  execSync(`curl ${deploymentUrl}`)
  execSync('sleep 10')
} catch (error) {
  core.setFailed(error)
}
