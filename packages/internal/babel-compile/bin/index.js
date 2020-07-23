#!/usr/bin/env node

const chalk = require('chalk')
const babel = require('@babel/cli/lib/babel/dir').default
const { getBabelConfig, getCompileConfigs } = require('@internal/helpers')
const { prepare } = require('./prepare')

const configs = getCompileConfigs()

async function compilePackage(config) {
  try {
    await prepare(config)
  } catch (e) {
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
  for (const config of configs) {
    const promise = compilePackage(config)

    if (config.sync || process.env.RESOLVE_ALLOW_PARALLEL_BUILDS != null) {
      await promise
    }
  }
}

main().catch(error => {
  // eslint-disable-next-line no-console
  console.error(error)
  process.exit(1)
})
