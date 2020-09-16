const { execSync } = require('child_process')
const core = require('@actions/core')
const os = require('os')
const fs = require('fs')
const path = require('path')

const isTrue = str => str && (str.toLowerCase() === 'true' || str.toLowerCase() === 'yes' || str.toLowerCase() === '1')
const randomize = str => `${str}-${Math.floor(Math.random() * 1000000)}`

const makeResolveRC = (appDir, apiUrl, user, token) => {
  if (!apiUrl || !user || !token) {
    throw Error(`invalid cloud settings input`)
  }

  const rc = path.resolve(appDir, '.resolverc')
  console.debug(`writing ${rc}`)
  fs.writeFileSync(rc, JSON.stringify({
    api_url: apiUrl,
    credentials: {
      user,
      refresh_token: token
    }
  }))
}

const toTable = tableOutput => {
  const rows = tableOutput.split(os.EOL).map(row => row.split(' ').map(val => val.trim()).filter(val => val))
  const definitions = rows.shift().map(name => name.toLowerCase())
  return rows.map(row => definitions.reduce((entry, name, index) => {
    entry[name] = row[index]
    return entry
  }, {}))
}
const toObject = tableOutput => {
  const rows = tableOutput.split(os.EOL).map(row => row.split(' ').map(val => val.trim()).filter(val => val))
  return rows.reduce((result, row) => {
    result[row[0]] = row[1]
    return result
  }, {})
}


const describeApp = (appName) => {
  console.debug(`retrieving deployment list`)
  const deployment = toTable(execSync('resolve-cloud ls').toString()).find(entry => entry.name === appName)
  if (!deployment) {
    console.error(`deployment with name (${appName}) not found with resolve-cloud ls`)
    return null
  }

  console.debug(`deployment list arrived, retrieving description`)
  const description = toObject(execSync(`resolve-cloud describe ${deployment.id}`).toString())
  if (!description) {
    console.error(`deployment ${deployment.id} not found with resolve-cloud describe`)
    return null
  }

  const { id, version } = deployment
  const { applicationUrl } = description

  return {
    deploymentId: id,
    appUrl: applicationUrl,
    appRuntime: version,
    appName
  }
}

try {
  const inputAppDir = core.getInput('app_directory')
  const appDir = path.isAbsolute(inputAppDir)
    ? inputAppDir
    : path.join(process.cwd(), inputAppDir)

  const inputAppName = core.getInput('app_name')
  const generateName = isTrue(core.getInput('generate_app_name'))

  let targetAppName = ''
  if (generateName) {
    const source = inputAppName !== '' ? inputAppName : JSON.parse(fs.readFileSync(path.resolve(appDir, 'package.json')).toString('utf-8')).name
    targetAppName = randomize(source)
  } else if (inputAppName !== '') {
    targetAppName = inputAppName
  }

  console.debug(`target application path: ${appDir}`)
  console.debug(`target application name: ${targetAppName}`)

  makeResolveRC(appDir, core.getInput('resolve_api_url'), core.getInput('resolve_user'), core.getInput('resolve_token'))

  const customArgs = core.getInput('deploy_args')

  console.debug(`deploying application to the cloud`)

  execSync(`resolve-cloud deploy ${targetAppName ? `--name ${targetAppName}` : ''} ${customArgs}`, {
    cwd: appDir
  })

  console.debug(`retrieving deployed application metadata`)

  const { deploymentId, appName, appRuntime, appUrl } = describeApp(targetAppName)

  core.setOutput('deployment_id', deploymentId)
  core.setOutput('app_name', appName)
  core.setOutput('app_runtime', appRuntime)
  core.setOutput('app_url', appUrl)

  core.saveState(`deployment_id`, deploymentId)
  core.saveState(`app_dir`, appDir)
} catch (error) {
  core.setFailed(error)
}
