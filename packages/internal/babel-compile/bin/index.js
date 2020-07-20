#!/usr/bin/env node

const chalk = require('chalk')
const babel = require('@babel/cli/lib/babel/dir').default
const { getBabelConfig, getCompileConfigs } = require('@internal/helpers')
const { prepare } = require('./prepare')

const configs = getCompileConfigs()

let isFailed = false

async function main() {
  for (const config of configs) {
    const cliOptions = {
      extensions: config.extensions,
      outFileExtension: config.outFileExtension,
      relative: config.relative,
      filenames: config.filenames,
      outDir: config.outDir,
      deleteDirOnStart: config.deleteDirOnStart
    }

    for (let key in cliOptions) {
      if (cliOptions[key] === undefined) {
        delete cliOptions[key]
      }
    }

    const promise = prepare(config)
      .then(() =>
        babel({
          babelOptions: {
            ...getBabelConfig({
              sourceType: config.sourceType,
              moduleType: config.moduleType,
              moduleTarget: config.moduleTarget
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
                config.moduleType
              }", moduleType: "${config.moduleTarget}" }`
            )
          })
          .catch(error => {
            // eslint-disable-next-line no-console
            console.error(error)
            process.exit(1)
          })
      )
      .catch(
        // eslint-disable-next-line no-loop-func
        error => {
          isFailed = true
          // eslint-disable-next-line no-console
          console.log(
            `↑ [${chalk.red(config.name)}] { moduleType: "${
              config.moduleType
            }", moduleType: "${config.moduleTarget}" }`
          )
          if (error != null && error !== '') {
            // eslint-disable-next-line no-console
            console.error(error)
          }
        }
      )

    if (config.sync || process.env.RESOLVE_ALLOW_PARALLEL_BUILDS != null) {
      await promise
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
