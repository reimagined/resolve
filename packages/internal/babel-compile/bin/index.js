#!/usr/bin/env node

const chalk = require('chalk')
const babel = require('@babel/cli/lib/babel/dir').default
const { getBabelConfig, getCompileConfigs } = require('@internal/helpers')
const { prepare } = require('./prepare')

const configs = getCompileConfigs()

let isFailed = false

async function compilePackage(config) {
  try {
    await prepare(config)
  } catch (e) {
    isFailed = true

    // eslint-disable-next-line no-console
    console.log(`↑ [${chalk.red(config.name)}] preparing failed`)
    if (e != null && e !== '') {
      // eslint-disable-next-line no-console
      console.error(e)
    }
    throw e
  }

  for (const babelConfig of config.babelCompile) {
    const cliOptions = {
      extensions: babelConfig.extensions,
      outFileExtension: babelConfig.outFileExtension,
      relative: babelConfig.relative,
      filenames: babelConfig.filenames,
      outDir: babelConfig.outDir,
      deleteDirOnStart: babelConfig.deleteDirOnStart
    }

    for (let key in cliOptions) {
      if (cliOptions[key] === undefined) {
        delete cliOptions[key]
      }
    }

    babel({
      babelOptions: {
        ...getBabelConfig({
          sourceType: config.sourceType,
          moduleType: babelConfig.moduleType,
          moduleTarget: babelConfig.moduleTarget
        }),
        sourceMaps: true,
        babelrc: false
      },
      cliOptions
    })
      .then(() => {
        // eslint-disable-next-line no-console
        console.log(
          `↑ [${chalk.green(config.name)}] { moduleType: "${
            babelConfig.moduleType
          }", moduleType: "${babelConfig.moduleTarget}" }`
        )
      })
      .catch(error => {
        // eslint-disable-next-line no-console
        console.error(error)
        process.exit(1)
      })
  }
}

async function main() {
  const map = new Map()
  let pendingPromises = []

  const preparePendingBuild = build => {
    build.status = 'building'
    const promise = compilePackage(build.config)
    build.promise = promise
    promise.then(() => (build.status = 'succeeded'))
    pendingPromises.push(promise)
  }

  for (const config of configs) {
    const build = { config, status: 'waiting' }
    map.set(config.name, build)

    if (config.dependencies.length > 0) {
      continue
    }

    preparePendingBuild(build)
  }

  while (true) {
    if (pendingPromises.length > 0) {
      await Promise.race([
        Promise.race(pendingPromises),
        Promise.all(pendingPromises)
      ])
    }

    pendingPromises = []

    for (const [, build] of map.entries()) {
      if (build.status === 'building') {
        pendingPromises.push(build.promise)
      } else if (
        build.status === 'waiting' &&
        build.config.dependencies.every(
          dependency => map.get(dependency).status === 'succeeded'
        )
      ) {
        preparePendingBuild(build)
      }
    }

    if (pendingPromises.length === 0) {
      break
    }
  }
}

main()
  .then(() => {
    if (isFailed) {
      process.exit(1)
    }
  })
  .catch(error => {
    // eslint-disable-next-line no-console
    console.error(error)
    process.exit(1)
  })
