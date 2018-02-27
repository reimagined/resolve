import 'regenerator-runtime/runtime'
import spawn from 'cross-spawn'
import path from 'path'
import chalk from 'chalk'
import fs from 'fs-extra'
import validateProjectName from 'validate-npm-package-name'

// eslint-disable-next-line no-console
const error = console.error
// eslint-disable-next-line no-console
const log = console.log

const validateAppDir = appPath => {
  const validFiles = [
    '.DS_Store',
    'Thumbs.db',
    '.git',
    '.gitignore',
    '.idea',
    'README.md',
    'LICENSE',
    'web.iml',
    '.hg',
    '.hgignore',
    '.hgcheck'
  ]
  log()

  return fs.readdirSync(appPath).filter(file => !validFiles.includes(file))
}

const displayValidationResults = results => {
  if (typeof results !== 'undefined') {
    results.forEach(error => {
      error(chalk.red(`  *  ${error}`))
    })
  }
}

const checkAppName = appName => {
  const result = validateProjectName(appName)
  if (!result.validForNewPackages) {
    error(
      `It is impossible to create an application called ${chalk.red(
        `"${appName}"`
      )} because of npm naming restrictions:`
    )
    displayValidationResults(result.errors)
    displayValidationResults(result.warnings)
  }
  return result.validForNewPackages
}

const installScripts = (scriptsPackage, resolveVersion) => {
  return new Promise((resolve, reject) => {
    const command = 'npm'

    const resultScriptsPackage = resolveVersion
      ? `${scriptsPackage}@${resolveVersion}`
      : scriptsPackage

    const args = [
      'install',
      '--save',
      '--save-exact',
      '--loglevel',
      'error',
      resultScriptsPackage
    ]

    const child = spawn(command, args, { stdio: 'inherit' })
    child.on('close', code => {
      if (code !== 0) {
        reject({ command: `${command} ${args.join(' ')}` })
        return
      }
      resolve()
    })
  })
}

const runScripts = (
  appPath,
  appName,
  originalDirectory,
  packagePath,
  isEmpty,
  scriptsPackage,
  resolveVersion,
  exactVersions
) => {
  const scriptsPath =
    packagePath || path.resolve(appPath, 'node_modules', scriptsPackage)

  const initScriptPath = path.resolve(scriptsPath, 'dist', 'scripts', 'init.js')

  const init = require(initScriptPath)
  init.default(
    appPath,
    appName,
    originalDirectory,
    isEmpty,
    packagePath,
    resolveVersion,
    exactVersions
  )
}

const createPackageJson = (appName, appPath) => {
  const packageJson = {
    name: appName,
    version: '0.1.0',
    private: true
  }
  fs.writeFileSync(
    path.join(appPath, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  )
}

export default async (
  name,
  packagePath,
  isEmpty,
  resolveVersion,
  exactVersions
) => {
  const scriptsPackage = 'resolve-scripts'
  const appPath = path.resolve(name)
  const appName = path.basename(appPath)

  if (!checkAppName(appName)) {
    process.exit(1)
  }

  fs.ensureDirSync(appName)
  const conflicts = validateAppDir(appPath)
  if (conflicts.length > 0) {
    log(`The ${chalk.green(appName)} directory contains conflicting files:`)
    log()
    for (const file of conflicts) {
      log(`  ${file}`)
    }
    log()
    log(
      'Either try using a new directory name, or remove the files listed above.'
    )
    process.exit(1)
  }

  log(`Creating a new Resolve app in ${chalk.green(appPath)}.`)
  log()

  createPackageJson(appName, appPath)

  const originalDirectory = process.cwd()
  process.chdir(appPath)

  log('Installing packages. This might take a couple of minutes.')

  log(`Installing ${chalk.cyan(`${scriptsPackage}@${resolveVersion}`)}...`)
  log()

  await installScripts(scriptsPackage, resolveVersion)

  runScripts(
    appPath,
    appName,
    originalDirectory,
    packagePath,
    isEmpty,
    scriptsPackage,
    resolveVersion,
    exactVersions
  )
}
