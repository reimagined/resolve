import AdmZip from 'adm-zip'
import commandLineArgs from 'command-line-args'
import chalk from 'chalk'
import fs from 'fs'
import https from 'https'
import spawn from 'cross-spawn'
import validateProjectName from 'validate-npm-package-name'

import isYarnAvailable from './is-yarn-available'
import messages from './messages'
import optionDefinitions from './option-definitions'
import checkApplicationName from './check-application-name'
import downloadResolveRepo from './download-resolve-repo'

const printIfDownloadFail = errMessage => {
  if (
    errMessage.toLowerCase().indexOf('invalid or unsupported zip format') > -1
  ) {
    const buf = fs.readFileSync(tmpFilePath).toString()
    if (buf.toLowerCase().indexOf('not found')) {
      log(chalk.red('Referent commit does not exists in resolve repository.'))
      log(
        chalk.red(
          'Maybe you forgot to merge your feature branch with dev branch'
        )
      )

      throw new Error('Repo downloading failed')
    }
  }

  throw new Error(errMessage)
}

const testExampleExists = () => {
  const examplesDirs = fs
    .readdirSync(`./${appName}/${repoDirName}/examples`)
    .filter(d =>
      fs.statSync(`./${appName}/${repoDirName}/examples/${d}`).isDirectory()
    )
    .map(e => ' * ' + e)
  if (!fs.existsSync(`./${appName}/${examplePath}`)) {
    throw new Error(
      `No such example, ${example}. Available examples are: ${EOL}` +
        examplesDirs.join(EOL)
    )
  }
}

const getResolvePackages = () => {
  // TODO. compile-time
  return new Promise(resolve => {
    resolve([
      'create-resolve-app',
      'resolve-api-handler-awslambda',
      'resolve-api-handler-express',
      'resolve-bus-zmq',
      'resolve-bus-memory',
      'resolve-bus-rabbitmq',
      'resolve-command',
      'resolve-es',
      'resolve-query',
      'resolve-readmodel-memory',
      'resolve-readmodel-mongo',
      'resolve-readmodel-base',
      'resolve-readmodel-mysql',
      'resolve-redux',
      'resolve-scripts',
      'resolve-storage-base',
      'resolve-storage-lite',
      'resolve-storage-mongo',
      'resolve-storage-mysql',
      'resolve-subscribe-mqtt',
      'resolve-subscribe-socket.io',
      'resolve-testing-tools'
    ])
  })
}

const patchPackageJson = () => {
  log()
  log(chalk.green('Patch package.json'))

  const packageJsonPath = `${process.cwd()}/${appName}/package.json`,
    packageJson = require(packageJsonPath)

  packageJson.name = appName
  packageJson.version = resolveVersion

  return getResolvePackages()
    .then(packages => {
      const namespaces = [
        'dependencies',
        'devDependencies',
        'peerDependencies',
        'optionalDependencies'
      ]
      for (const namespace of namespaces) {
        if (packageJson[namespace]) {
          for (const packageName of Object.keys(packageJson[namespace])) {
            if (packages.includes(packageName)) {
              packageJson[namespace][packageName] = resolveVersion
            }
          }
        }
      }
    })
    .then(() =>
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
    )
}

const install = () => {
  log()
  log(chalk.green('Install dependencies'))

  const packageJsonPath = `${process.cwd()}/${appName}/package.json`,
    packageJson = require(packageJsonPath)

  if (packageJson.workspaces && !useYarn) {
    // eslint-disable-next-line
    throw 'Managing dependencies in a monorepo is not supported with `npm`. Please use `yarn` to install dependencies.'
  }

  const command = `cd ./${appName} && ${useYarn ? 'yarn' : 'npm i'}`
  const proc = spawn.sync(command, [], { stdio: 'inherit', shell: true })
  if (proc.status !== 0) {
    throw Error(`\`${command}\` failed`)
  }
}

const printFinishOutput = () => {
  const displayCommand = (isDefaultCmd = false) =>
    useYarn ? 'yarn' : isDefaultCmd ? 'npm' : 'npm run'

  log()
  log(`Success! ${appName} is created `)
  log('In that directory, you can run the following commands:')

  log()
  log(chalk.cyan(`  ${displayCommand()} dev`))
  log('    Starts the development server.')

  log()
  log(chalk.cyan(`  ${displayCommand()} test`))
  log('    Starts the test runner.')

  log()
  log(chalk.cyan(`  ${displayCommand()} test:functional`))
  log('    Starts the functionality test runner.')

  log()
  log(chalk.cyan(`  ${displayCommand()} build`))
  log('    Bundles the app into static files for production.')

  log()
  log(chalk.cyan(`  ${displayCommand(1)} start`))
  log(
    '    Starts the production server. (run ' +
      `${chalk.cyan(`${displayCommand(false)} build`)} before)`
  )

  log()
  log('We suggest that you begin by typing:')
  log()
  log(chalk.cyan('  cd'), `./${appName}`)
  log(`  ${chalk.cyan(`${displayCommand(false)} dev`)}`)
  log()
  log('Happy coding!')
}

const sendAnalytics = () =>
  new Promise((resolve, reject) => {
    const analyticsUrl = `${analyticsUrlBase}/${example}/${resolveVersion}`
    https.get(analyticsUrl, function(response) {
      response.on('end', resolve)
      response.on('error', reject)
    })
  })

const pipeline = pool => {
  const {
    prepareOptions,
    startCreatingApplication,
    checkApplicationName,
    downloadResolveRepo,
    testExampleExists,
    moveExample,
    patchPackageJson,
    install,
    printFinishOutput,
    sendAnalytics
  } = pool
  
  prepareOptions(pool)
    .then(startCreatingApplication(pool))
    .then(checkApplicationName(pool))
    .then(downloadResolveRepo(pool))
    .then(testExampleExists(pool))
    .then(moveExample(pool))
    .then(patchPackageJson(pool))
    .then(install(pool))
    .then(printFinishOutput(pool))
    .then(sendAnalytics(pool))
    .catch(error => {
      // eslint-disable-next-line no-console
      console.error(chalk.red(error))
    })
}

export default pipeline
