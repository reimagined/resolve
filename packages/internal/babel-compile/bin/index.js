#!/usr/bin/env node

const minimist = require('minimist')
const chalk = require('chalk')
const { createProfiler } = require('./profiler')
const babel = require('@babel/cli/lib/babel/dir').default
const { getBabelConfig, getCompileConfigs } = require('@internal/helpers')
const { prepare } = require('./prepare')

let isFailed = false

async function compilePackage(config, batchNumber) {
  const profiler = createProfiler()

  try {
    profiler.start('prepare')
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
  } finally {
    profiler.finish('prepare')
  }

  let index = 0
  for (const babelConfig of config.babelCompile) {
    const cliOptions = {
      extensions: babelConfig.extensions,
      outFileExtension: babelConfig.outFileExtension,
      relative: babelConfig.relative,
      filenames: babelConfig.filenames,
      outDir: babelConfig.outDir,
      deleteDirOnStart: babelConfig.deleteDirOnStart,
    }

    for (let key in cliOptions) {
      if (cliOptions[key] === undefined) {
        delete cliOptions[key]
      }
    }

    const buildMark = `${config.name}-build-${
      babelConfig.moduleType
    }-${index++}`
    profiler.start(buildMark)
    const buildPromise = babel({
      babelOptions: {
        ...getBabelConfig({
          sourceType: config.sourceType,
          moduleType: babelConfig.moduleType,
          moduleTarget: babelConfig.moduleTarget,
        }),
        sourceMaps: true,
        babelrc: false,
      },
      cliOptions,
    })
      .then(() => {
        profiler.finish(buildMark)
        // eslint-disable-next-line no-console
        console.log(
          `↑ [${chalk.green(config.name)}] ${babelConfig.moduleType}:${
            babelConfig.moduleTarget
          } { tsc: ${profiler.time('prepare')}, babel: ${profiler.time(
            buildMark
          )}, total: ${
            profiler.time('prepare') + profiler.time(buildMark)
          } }, batch #${batchNumber}`
        )
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error(error)
        process.exit(1)
      })

    await buildPromise
  }
}

async function main() {
  const registry = getCompileConfigs().map((entry) => ({
    ...entry,
    status: 'waiting',
  }))

  const executeBatch = (number = 0) => {
    const batch = registry.filter(
      (entry) => entry.dependencies.length === 0 && entry.status === 'waiting'
    )
    if (batch.length === 0) {
      return Promise.resolve()
    }

    return Promise.all(
      batch.map((entry) => {
        entry.status = 'building'
        return compilePackage(entry.config, number).then(() => {
          entry.status = 'built'
          registry.map((node) => {
            node.dependencies = node.dependencies.filter(
              (dependency) => dependency !== entry.name
            )
          })
          return executeBatch(number + 1)
        })
      })
    )
  }

  await executeBatch()
}

main(minimist(process.argv.slice(2)))
  .then(() => {
    if (isFailed) {
      process.exit(1)
    }
  })
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error)
    process.exit(1)
  })
