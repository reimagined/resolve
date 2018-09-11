const path = require('path')
const find = require('glob').sync
const getBabelConfig = require('./babel.config').getConfig
const babel = require('@babel/cli/lib/babel/dir').default

const files = find('./packages/**/resolve-bus-memory/package.json', {
  ignore: '**/node_modules/**'
})

const configs = []

for (const filePath of files) {
  const { name, babelCompile } = require(filePath)

  if (!Array.isArray(babelCompile)) {
    throw new Error(`[${name}] package.json "babelCompile" must be an array`)
  }

  for (let index = 0; index < babelCompile.length; index++) {
    const config = babelCompile[index]
    if (config.moduleType.constructor !== String) {
      throw new Error(`.babelCompile[${index}].moduleType must be a string`)
    }
    if (config.moduleTarget.constructor !== String) {
      throw new Error(`.babelCompile[${index}].moduleTarget must be a string`)
    }
    if (config.inputDir.constructor !== String) {
      throw new Error(`.babelCompile[${index}].inputDir must be a string`)
    }
    if (config.outDir.constructor !== String) {
      throw new Error(`.babelCompile[${index}].outDir must be a string`)
    }

    config.name = name
    config.inputDir = path.resolve(path.dirname(filePath), config.inputDir)
    config.outDir = path.resolve(path.dirname(filePath), config.outDir)

    configs.push(config)
  }
}

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
      verbose: true
    }
  }).catch(error => {
    console.error(error)
  })
}
