#!/usr/bin/env node

const AdmZip = require('adm-zip')
const commandLineArgs = require('command-line-args')
const chalk = require('chalk')
const fs = require('fs')
const https = require('https')
const replace = require('replace')
const spawn = require('cross-spawn')
const validateProjectName = require('validate-npm-package-name')

// eslint-disable-next-line no-console
const log = console.log

// eslint-disable-next-line no-console
const error = console.error

const EOL = require('os').EOL

const optionDefinitions = [
  { name: 'example', alias: 'e', type: String },
  { name: 'branch', alias: 'b', type: String },
  { name: 'commit', alias: 'c', type: String },
  { name: 'version', alias: 'V', type: Boolean },
  { name: 'help', alias: 'h', type: Boolean }
]

const optionsInfo =
  `Options:${EOL}` +
  EOL +
  `  -e, --example    creates an example application base on application from resolve examples` +
  ` directory${EOL}` +
  `                   Now you can choose one of the next examples:${EOL}` +
  `                     todo - todo list ${EOL}` +
  `                     hello-world - sinple empty example with single hello world page ${EOL}` +
  `                     todo-two-levels - two levels todo list ${EOL}` +
  `  -b, --branch     branch (optional, master is default)${EOL}` +
  `  -c, --commit     commit ${EOL}` +
  `  -V, --version    outputs the version number${EOL}` +
  `  -h, --help       outputs usage information${EOL}`

const messages = {
  help:
    `Usage: create-resolve-app ${chalk.green(
      '<project-directory>'
    )} [options]${EOL}` +
    EOL +
    optionsInfo +
    EOL +
    `If you have any problems, you can create an issue:${EOL}` +
    `  ${chalk.cyan('https://github.com/reimagined/resolve/issues/new')}`,

  emptyAppNameError:
    `Specify the project directory:${EOL}` +
    `  ${chalk.cyan('create-resolve-app')} ${chalk.green(
      '<project-directory> [options]'
    )}${EOL}` +
    EOL +
    `For example:${EOL}` +
    `  ${chalk.cyan('create-resolve-app')} ${chalk.green(
      'my-resolve-app'
    )}${EOL}` +
    EOL +
    optionsInfo +
    EOL +
    `Run ${chalk.cyan('create-resolve-app --help')} to see all options.`,

  startCreatingApp: (appName, example, options) =>
    `Creating ${appName} in ./${appName} based on ${example} example` +
    (options.commit ? ` (commit SHA:${options.commit})` : '') +
    (options.branch ? ` (from ${options.branch} branch)` : ''),

  unknownOptions: options =>
    `You have specified an unsupported option(s): ${chalk.red(options)}${EOL}` +
    EOL +
    `Run ${chalk.cyan('create-resolve-app --help')} to see all options.`
}

const options = commandLineArgs(optionDefinitions, { partial: true })
const unknownOptions =
  options._unknown && options._unknown.filter(x => x.startsWith('-'))

const resolveVersion = require('../package.json').version

if (unknownOptions && unknownOptions.length) {
  const options = unknownOptions.join()
  log(messages.unknownOptions(options))
} else if (options.help) {
  log(messages.help)
} else if (options.version) {
  log(resolveVersion)
} else if (!options._unknown) {
  log(messages.emptyAppNameError)
} else {
  let appName = options._unknown[0],
    example = options.example || 'hello-world',
    branch = options.branch ? options.branch : 'master',
    examplePath = `./resolve-${branch}/examples/${example}`,
    resolveRepoPath = `https://codeload.github.com/reimagined/resolve/zip/${branch}`,
    tmpFilePath = `./resolve-${branch}.zip`

  const startCreatingApp = () =>
    Promise.resolve(() =>
      log(messages.startCreatingApp(appName, example, options))
    )

  const checkAppName = () => {
    const result = validateProjectName(appName)
    if (!result.validForNewPackages) {
      error(
        `It is impossible to create an application called ${chalk.red(
          `"${appName}"`
        )} because of npm naming restrictions:`
      )
      ;[]
        .concat(result.errors || [])
        .concat(result.warnings || [])
        .forEach(error => {
          error(chalk.red(`  *  ${error}`))
        })
    }

    return result.validForNewPackages
  }

  const downloadRepo = () =>
    new Promise(resolve => {
      log(chalk.green('Load example'))
      https.get(resolveRepoPath, function(response) {
        response.on('data', function(data) {
          fs.appendFileSync(tmpFilePath, data)
        })

        response.on('end', function() {
          var zip = new AdmZip(tmpFilePath)
          zip.extractAllTo(`./${appName}`)
          fs.unlink(tmpFilePath)
          resolve()
        })
      })
    })

  const copyExample = () => {
    log()
    log(chalk.green('Copy example && install dependencies'))
    let command =
      `cd ${appName} ` +
      ` && cp -r ${examplePath}/* . && cp -r ${examplePath}/.[a-zA-Z0-9]* .` +
      ` && rm -rf ./resolve-${branch} && npm i`

    const proc = spawn.sync(command, [], { stdio: 'inherit', shell: true })
    if (proc.status !== 0) {
      throw Error(`\`${command}\` failed`)
    }
  }

  const patchPackageJson = () =>
    replace({
      regex: /^(\s*"name":\s*)".*$/,
      replacement: /\1"${appName}"/,
      paths: [`./${appName}/package.json`],
      recursive: false,
      silent: false
    })

  const printFinishOutput = () => {
    const displayCommand = (isDefaultCmd = false) =>
      isDefaultCmd ? 'npm' : 'npm run'

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
    log(chalk.cyan(`  ${displayCommand()} test:e2e`))
    log('    Starts the functionality test runner.')

    log()
    log(chalk.cyan(`  ${displayCommand()} build`))
    log('    Bundles the app into static files for production.')

    log()
    log(chalk.cyan(`  ${displayCommand(1)} start`))
    log(
      '    Starts the production server. (run ' +
        `  ${chalk.cyan(`${displayCommand(false)} build`)} before)`
    )

    log()
    log('We suggest that you begin by typing:')
    log()
    log(chalk.cyan('  cd'), `./${appName}`)
    log(`  ${chalk.cyan(`${displayCommand(false)} dev`)}`)
    log()
    log('Happy coding!')
  }

  startCreatingApp()
    .then(checkAppName)
    .then(downloadRepo)
    .then(copyExample)
    .then(patchPackageJson)
    .then(printFinishOutput)
    .catch(e => log(chalk.red(e)))
}
