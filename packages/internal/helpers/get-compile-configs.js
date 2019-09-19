const path = require('path')
const find = require('glob').sync

const { getResolveDir } = require('./get-resolve-dir')

let _configs
const getCompileConfigs = () => {
  if (_configs) {
    return _configs
  }

  const configs = []

  for (const filePath of find('./packages/**/package.json', {
    cwd: getResolveDir(),
    absolute: true
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
      configs.push(config)
    }
  }

  _configs = configs

  return configs
}

module.exports = { getCompileConfigs }
