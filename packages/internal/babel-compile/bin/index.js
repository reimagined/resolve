#!/usr/bin/env node

const os = require('os')
const babel = require('@babel/cli/lib/babel/dir').default
const { getBabelConfig, getCompileConfigs } = require('@internal/helpers')
const { prepare } = require('./prepare')

const THREAD_COUNT = os.cpus().length
const MEMORY_LIMIT = Math.min(os.totalmem() / (1024 * 1024 * 8), 128)

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

async function waitFreeMem() {
  for (let index = 0; index < 15; index++) {
    if (os.freemem() / (1024 * 1024) < MEMORY_LIMIT) {
      // eslint-disable-next-line no-console
      console.log(`freemem = ${os.freemem() / (1024 * 1024)}. sleep 1000 ms`),
        await delay(1000)
    }
  }
}

async function thread(configs, threadIndex) {
  for (
    let configIndex = threadIndex;
    configIndex < configs.length;
    configIndex += THREAD_COUNT
  ) {
    const config = configs[configIndex]
    if (config == null) {
      continue
    }
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

    await waitFreeMem()

    await prepare(config)
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
              `↑ [${config.name}] { moduleType: "${config.moduleType}", moduleType: "${config.moduleTarget}" }`
            )
          })
          .catch(error => {
            // eslint-disable-next-line no-console
            console.error(error)
            process.exit(1)
          })
      )
      .catch(error => {
        if (error != null && error !== '') {
          // eslint-disable-next-line no-console
          console.error(error)
        }
      })
  }
}

async function main() {
  const configs = getCompileConfigs()

  let promises = []
  for (let threadIndex = 0; threadIndex < THREAD_COUNT; threadIndex++) {
    promises.push(thread(configs, threadIndex))
  }
  await Promise.all(promises)
}

main().catch(error => {
  // eslint-disable-next-line no-console
  console.error(error)
  process.exit(1)
})
