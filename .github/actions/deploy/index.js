const { execSync } = require('child_process')
const core = require('@actions/core')
const os = require('os')
const fs = require('fs')
const path = require('path')

const isTrue = (str) =>
  str &&
  (str.toLowerCase() === 'true' ||
    str.toLowerCase() === 'yes' ||
    str.toLowerCase() === '1')
const randomize = (str) => `${str}-${Math.floor(Math.random() * 1000000)}`
const readPackageJSON = (appDir) =>
  JSON.parse(
    fs.readFileSync(path.resolve(appDir, 'package.json')).toString('utf-8')
  )
const writePackageJSON = (appDir, content) =>
  fs.writeFileSync(
    path.resolve(appDir, 'package.json'),
    JSON.stringify(content, null, 2)
  )
const ensureHttp = (str) => {
  if (str) return str.startsWith('http') ? str : `http://${str}`
  return str
}

const makeResolveRC = (appDir, apiUrl, user, token) => {
  if (!apiUrl || !user || !token) {
    throw Error(`invalid cloud settings input`)
  }

  const rc = path.resolve(appDir, '.resolverc')
  console.debug(`writing ${rc}`)
  fs.writeFileSync(
    rc,
    JSON.stringify({
      api_url: apiUrl,
      credentials: {
        user,
        refresh_token: token,
      },
    })
  )
}

const patchDependencies = (mask, version, readPackage, writePackage) => {
  if (!mask) {
    throw Error('no package mask specified')
  }

  if (!version) {
    throw Error('no new version specified')
  }

  const regExp = new RegExp('^' + mask)
  const packageJSON = readPackage()

  if (!packageJSON) {
    console.log(`No package.json file`)
    return
  }

  const sections = [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
  ]

  sections.forEach((section) => {
    if (!packageJSON[section]) {
      console.log(`No ${section} in package.json`)
      return
    }

    Object.keys(packageJSON[section]).forEach(function (lib) {
      if (regExp.test(lib)) {
        console.log(
          `${section}.${lib} (${packageJSON[section][lib]} -> ${version})`
        )
        packageJSON[section][lib] = version
      }
    })
  })

  console.log('Patching package.json')
  writePackage(packageJSON)
  console.log('Complete')
}

const writeNpmRc = (appDir, registry) => {
  if (!registry) {
    throw Error(`wrong NPM registry settings`)
  }

  const npmRc = path.resolve(appDir, '.npmrc')
  const yarnRc = path.resolve(appDir, '.yarnrc')

  console.debug(`writing ${npmRc}`)
  fs.writeFileSync(npmRc, `registry=${registry}\n`)
  fs.writeFileSync(yarnRc, `registry "${registry}\n"`)
}

const execResolveCloud = (appDir, args, stdio = 'pipe') =>
  execSync(`yarn --silent resolve-cloud ${args}`, {
    cwd: appDir,
    stdio,
  })

const toTable = (tableOutput) => {
  const rows = tableOutput
    .split(os.EOL)
    .filter((row) => row.trim() !== '')
    .map((row) =>
      row
        .split(' ')
        .map((val) => val.trim())
        .filter((val) => val)
    )
  const definitions = rows.shift().map((name) => name.toLowerCase())
  return rows.map((row) =>
    definitions.reduce((entry, name, index) => {
      entry[name] = row[index]
      return entry
    }, {})
  )
}
const toObject = (tableOutput) => {
  const rows = tableOutput
    .split(os.EOL)
    .filter((row) => row.trim() !== '')
    .map((row) =>
      row
        .split(' ')
        .map((val) => val.trim())
        .filter((val) => val)
    )
  return rows.reduce((result, row) => {
    result[row[0]] = row[1]
    return result
  }, {})
}

const describeApp = (appName, resolveCloud) => {
  const deployment = toTable(resolveCloud('ls').toString()).find(
    (entry) => entry.name === appName
  )
  if (!deployment) {
    console.error(
      `deployment with name (${appName}) not found with resolve-cloud ls`
    )
    return null
  }

  console.debug(`deployment list arrived, retrieving description`)
  const description = toObject(
    resolveCloud(`describe ${deployment.id}`).toString()
  )
  if (!description) {
    console.error(
      `deployment ${deployment.id} not found with resolve-cloud describe`
    )
    return null
  }

  const { id, version } = deployment
  const { applicationUrl } = description

  return {
    deploymentId: id,
    appUrl: applicationUrl,
    appRuntime: version,
    appName,
  }
}

try {
  const inputAppDir = core.getInput('app_directory')
  const appDir = path.isAbsolute(inputAppDir)
    ? inputAppDir
    : path.join(process.cwd(), inputAppDir)

  const readAppPackage = () => readPackageJSON(appDir)
  const writeAppPackage = (content) => writePackageJSON(appDir, content)
  const resolveCloud = (args, stdio) => execResolveCloud(appDir, args, stdio)

  const resolveVersion = core.getInput('resolve_version')
  if (resolveVersion) {
    patchDependencies(
      '(?!resolve-cloud-common$)(?!resolve-cloud$)(resolve-.*$)',
      resolveVersion,
      readAppPackage,
      writeAppPackage
    )
  }

  const npmRegistry = ensureHttp(core.getInput('npm_registry'))
  if (npmRegistry) {
    writeNpmRc(appDir, npmRegistry)
  }

  console.log(`installing packages within ${appDir}`)

  execSync('yarn install --frozen-lockfile', {
    cwd: appDir,
    stdio: 'inherit',
  })

  const inputAppName = core.getInput('app_name')
  const generateName = isTrue(core.getInput('generate_app_name'))

  let targetAppName = ''
  if (generateName) {
    const source = inputAppName !== '' ? inputAppName : readAppPackage().name
    targetAppName = randomize(source)
  } else if (inputAppName !== '') {
    targetAppName = inputAppName
  }

  console.debug(`target application path: ${appDir}`)
  console.debug(`target application name: ${targetAppName}`)

  const localMode = isTrue(core.getInput('local_mode'))

  if (!localMode) {
    makeResolveRC(
      appDir,
      core.getInput('resolve_api_url'),
      core.getInput('resolve_user'),
      core.getInput('resolve_token')
    )
  }

  const customArgs = core.getInput('deploy_args')

  console.debug(`deploying application to the cloud`)

  let baseArgs = ''
  baseArgs += targetAppName ? ` --name ${targetAppName}` : ''
  baseArgs += npmRegistry ? ` --npm-registry ${npmRegistry}` : ''

  try {
    resolveCloud(`deploy ${baseArgs} ${customArgs}`, 'inherit')
    console.debug('the application deployed successfully')
  } finally {
    console.debug(`retrieving deployed application metadata`)

    const { deploymentId, appName, appRuntime, appUrl } = describeApp(
      targetAppName,
      resolveCloud
    )

    core.setOutput('deployment_id', deploymentId)
    core.setOutput('app_name', appName)
    core.setOutput('app_runtime', appRuntime)
    core.setOutput('app_url', appUrl)

    core.saveState(`deployment_id`, deploymentId)
    core.saveState(`app_dir`, appDir)
  }
} catch (error) {
  core.setFailed(error)
}
