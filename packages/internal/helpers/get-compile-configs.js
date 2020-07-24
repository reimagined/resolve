const path = require('path')
const find = require('glob').sync

const { getResolveDir } = require('./get-resolve-dir')

function changeOrder(configs, packageName) {
  const includes = configs
    .map((config, index) => ({ config, index }))
    .filter(({ config: { name } }) => name === packageName)

  const configLength = configs.length
  for (const { config, index } of includes) {
    for (let subIndex = index; subIndex < configLength - 1; subIndex++) {
      configs[subIndex] = configs[subIndex + 1]
    }
    configs[configLength - 1] = config
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
      config.deleteDirOnStart = false
      config.filenames = [config.inputDir]

      switch (config.sourceType) {
        case 'ts':
          config.extensions = ['.ts', '.js']
          break
        case 'tsx':
          config.extensions = ['.ts', '.tsx', '.js', '.jsx']
          break
        default:
          config.extensions = '.js'
          break
      }

      configs.push(config)
    }
  }

  /*
  changeOrder(configs, 'resolve-core')
  changeOrder(configs, 'resolve-client')
  changeOrder(configs, 'resolve-react-hooks')
  changeOrder(configs, 'resolve-redux')
  */
  _configs = configs

  return configs
}

module.exports = { getCompileConfigs }
