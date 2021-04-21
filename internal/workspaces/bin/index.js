#!/usr/bin/env node

const path = require('path')
const { execSync, spawn } = require('child_process')
const { readFile } = require('fs')
const minimist = require('minimist')
const chalk = require('chalk')
const micromatch = require('micromatch')
const rimraf = require('rimraf')
const { createProfiler, getRepoRoot } = require('@internal/helpers')

const profiler = createProfiler()
const log = {
  // eslint-disable-next-line no-console
  info: console.info,
  // eslint-disable-next-line no-console
  error: console.error,
}

const workspaceFilter = (workspaces, ignore, name) => {
  const { location } = workspaces[name]
  if (ignore.length > 0) {
    return !micromatch.isMatch(location, ignore)
  }
  return true
}

const sequentialProcessor = async (items, callback, index = 0) => {
  if (index >= items.length) {
    return
  }
  await callback(items[index])
  await sequentialProcessor(items, callback, index + 1)
}

const parallelProcessor = async (items, callback) =>
  Promise.all(items.map((item) => callback(item)))

const getWorkspaces = () =>
  JSON.parse(
    execSync('yarn workspaces --silent info', { stdio: 'pipe' }).toString()
  )

const execShellCommand = async (shellCommand, workspace) => {
  const { absolutePath, location } = workspace
  try {
    log.info(`[${chalk.bold(chalk.green(workspace.location))}]: ${chalk.dim(shellCommand)}`)
    await new Promise((resolve, reject) => {
      const [command, ...args] = shellCommand
        .split(' ')
        .map((part) => part.trim())

      const proc = spawn(command, args, {
        cwd: absolutePath,
        env: process.env,
        shell: true,
        stdio: 'inherit',
      })

      proc.on('error', reject)
      proc.on('exit', (code) => {
        if (code !== 0) {
          reject(Error(`Process exit with code ${code}`))
        }
        return resolve(code)
      })
    })
  } catch (e) {
    log.info(chalk.bold(chalk.red(`*** ${location} ***`)))
    throw e
  }
}

const cleanWorkspace = async ({ absolutePath, location }) => {
  await new Promise((resolve, reject) => {
    rimraf(path.resolve(absolutePath, 'node_modules'), (error) => {
      if (error) {
        return reject(error)
      }
      return resolve()
    })
  })
  log.info(`[${chalk.bold(chalk.green(location))}]: cleaned`)
}

const execNpmScript = async (script, workspace) => {
  let shouldExecute = false
  const { absolutePath, location } = workspace
  try {
    const data = await new Promise((resolve, reject) =>
      readFile(
        path.resolve(absolutePath, 'package.json'),
        { encoding: 'utf-8' },
        (error, data) => {
          if (error != null) {
            return reject(error)
          }
          return resolve(data)
        }
      )
    )
    const pkg = JSON.parse(data)
    shouldExecute =
      pkg != null && pkg.scripts != null && pkg.scripts[script] != null
  } catch (e) {
    log.info(chalk.bold(chalk.red(`*** ${location} ***`)))
  }

  if (shouldExecute) {
    return await execShellCommand(`yarn ${script}`, workspace)
  }
}

const doAll = async (args, workspaceOperator) => {
  const { i = null, parallel = false } = args
  const workspaces = getWorkspaces()
  const ignoreByLocation = i != null ? i.split(',') : []

  const toProcess = Object.keys(workspaces)
    .filter(workspaceFilter.bind(null, workspaces, ignoreByLocation))
    .map((name) => ({
      name,
      location: workspaces[name].location,
      absolutePath: path.resolve(getRepoRoot(), workspaces[name].location),
    }))

  const processor = parallel
    ? parallelProcessor.bind(null, toProcess, workspaceOperator)
    : sequentialProcessor.bind(null, toProcess, workspaceOperator)

  await processor()

  return toProcess.length
}

const main = async (args) => {
  const [command] = args._

  let count = 0

  switch (command) {
    case 'all':
      const shellCommand = args._[1]
      if (shellCommand == null || shellCommand.trim() === '') {
        throw Error('shell command not specified')
      }

      count = await doAll(args, execShellCommand.bind(null, shellCommand))
      break

    case 'clean':
      count = await doAll(args, cleanWorkspace)
      await cleanWorkspace({ absolutePath: getRepoRoot(), location: '/' })
      count++
      break

    case 'run-script':
      const script = args._[1]
      if (script == null || script.trim() === '') {
        throw Error('script not specified')
      }
      count = await doAll(args, execNpmScript.bind(null, script))
      break

    default:
      throw Error(`Unknown or empty command: ${command}`)
  }

  return {
    command,
    count,
  }
}

profiler.start('task')

main(minimist(process.argv.slice(2)))
  .then(({ command, count }) => {
    profiler.finish('task')
    log.info(
      `${chalk.bold(
        chalk.yellow(count)
      )} workspaces processed with [${chalk.bold(
        chalk.blue(command)
      )}] in ${chalk.bold(chalk.green(profiler.time('task')))} s`
    )
  })
  .catch((error) => {
    log.error(chalk.bold(chalk.red(error.stack)))
    process.exit(1)
  })
