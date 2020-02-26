#!/usr/bin/env node

const babel = require('@babel/cli/lib/babel/dir').default
const { getBabelConfig, getCompileConfigs } = require('@internal/helpers')

const configs = getCompileConfigs()

for (const config of configs) {
  const cliOptions = {
    extensions: config.extensions,
    outFileExtension: config.outFileExtension,
    inputDir: config.inputDir,
    relative: config.relative,
    filenames: config.filenames,
    outDir: config.outDir,
    deleteDirOnStart: config.deleteDirOnStart
  }

  for(let key in cliOptions) {
    if(cliOptions[key] === undefined) {
      delete cliOptions[key]
    }
  }
  // console.log('===== config =====')
  // console.log(config)
  // console.log('')
  // console.log('===== cliOptions =====')
  // console.log(cliOptions)


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
}
