const path = require('path')
const find = require('glob').sync

const { getResolveDir } = require('./get-resolve-dir')

function makeSyncAtEnd(configs, packageName) {
  const includedIndexes = configs.reduce((acc, config, index) => (
    config.name === packageName ? [index].concat(acc) : acc
  ), [])

  for (const index of includedIndexes) {
    const config = configs[index]
    configs.splice(index, 1)
    configs.push(config)
    config.sync = true
  }
}

let _configs
const getCompileConfigs = () => {
  if (_configs) {
    return _configs
  }

  const configs = []

  for (const filePath of find('./packages/**/package.json', {
    cwd: getResolveDir(),
    absolute: true,
    ignore: ['**/node_modules/**', './node_modules/**']
  })) {
    if (filePath.includes('node_modules')) {
      continue
    }
    if (
      filePath.includes('packages\\internal') ||
      filePath.includes('packages/internal')
    ) {
      continue
    }
    if (
      filePath.includes(`optional\\${'dependencies'}`) ||
      filePath.includes(`optional/${'dependencies'}`)
    ) {
      continue
    }

    const { version, name, babelCompile } = require(filePath)

    if (!Array.isArray(babelCompile)) {
      throw new Error(`[${name}] package.json "babelCompile" must be an array`)
    }

    for (let index = 0; index < babelCompile.length; index++) {
      const config = babelCompile[index]
      if (config.sourceType == null) {
        config.sourceType = 'js'
      }
      if (config.sourceType.constructor !== String) {
        throw new Error(`.babelCompile[${index}].sourceType must be a string`)
      }
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
      config.version = version
      config.directory = path.dirname(filePath)
      config.inputDir = path.join(config.directory, config.inputDir)
      config.outDir = path.join(config.directory, config.outDir)
      config.outFileExtension = config.moduleType === 'mjs' ? '.mjs' : '.js'
      config.extensions = config.sourceType === 'ts' ? ['.ts', '.js'] : '.js'
      config.deleteDirOnStart = false
      config.filenames = [config.inputDir]

      configs.push(config)
    }
  }

  makeSyncAtEnd(configs, 'resolve-core')
  makeSyncAtEnd(configs, 'resolve-client')
  makeSyncAtEnd(configs, 'resolve-react-hooks')

  _configs = configs

  return configs
}

module.exports = { getCompileConfigs }
