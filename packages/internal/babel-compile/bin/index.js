#!/usr/bin/env node

const babel = require('@babel/cli/lib/babel/dir').default
const { getBabelConfig, getCompileConfigs } = require('@internal/helpers')

const configs = getCompileConfigs()

for (const config of configs) {
  babel({
    babelOptions: {
      ...getBabelConfig({
        moduleType: config.moduleType,
        moduleTarget: config.moduleTarget
      }),
      sourceMaps: true,
      babelrc: false
    },
    cliOptions: {
      filenames: [config.inputDir],
      outDir: config.outDir,
      deleteDirOnStart: true
    }
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
