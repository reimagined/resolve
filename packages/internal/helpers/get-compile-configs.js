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
      config.outDir =
        config.sourceType === 'ts'
          ? '.'
          : path.join(config.directory, config.outDir)
      config.outFileExtension = config.moduleType === 'mjs' ? '.mjs' : '.js'
      config.extensions = config.sourceType === 'ts' ? '.ts' : '.js'
      config.deleteDirOnStart = config.sourceType === 'ts' ? false : true
      config.filenames = config.sourceType === 'ts' ? [] : [config.inputDir]
      config.relative = config.sourceType === 'ts' ? getResolveDir() : undefined

      if (config.sourceType === 'ts') {
        for (const fileName of find(`./**/*${config.extensions}`, {
          cwd: config.inputDir,
          absolute: true
        })) {
          if (fileName.includes('node_modules')) {
            continue
          }
          if (fileName.includes('__mocks__')) {
            continue
          }
          if (fileName.includes('__tests__')) {
            continue
          }
          if (fileName.includes('.d.ts')) {
            continue
          }
          config.filenames.push(fileName.replace(config.relative, '.'))
        }
      }
      configs.push(config)
    }
  }

  _configs = configs

  return configs
}

module.exports = { getCompileConfigs }
