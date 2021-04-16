const path = require('path')
const { prepareBuildRegistry } = require('./prepare-build-registry')

const { getResolveDir } = require('./get-resolve-dir')

const externalDependencies = ['resolve-cloud-common']

const isInternalDependency = (name) =>
  name.startsWith('@resolve-js/') && !externalDependencies.includes(name)

const getCompileConfigs = (filter = null) => {
  const registry = prepareBuildRegistry(filter)

  registry.map((entry) => {
    const location = path.resolve(
      getResolveDir(),
      entry.location,
      'package.json'
    )

    const {
      version,
      name,
      sourceType,
      babelCompile,
      dependencies = {},
    } = require(location)

    if (!Array.isArray(babelCompile)) {
      throw new Error(`[${name}] package.json "babelCompile" must be an array`)
    }

    const config = {
      name,
      version,
      babelCompile,
      directory: path.dirname(location),
      sourceType,
      dependencies: Object.keys(dependencies).reduce(
        (acc, dependencyName) =>
          isInternalDependency(dependencyName)
            ? acc.concat(dependencyName)
            : acc,
        []
      ),
    }

    if (config.sourceType == null) {
      config.sourceType = 'js'
    }

    if (config.sourceType.constructor !== String) {
      throw new Error(`.sourceType must be a string`)
    }

    for (let index = 0; index < babelCompile.length; index++) {
      const babelConfig = babelCompile[index]

      if (babelConfig.moduleType.constructor !== String) {
        throw new Error(`.babelCompile[${index}].moduleType must be a string`)
      }
      if (babelConfig.moduleTarget.constructor !== String) {
        throw new Error(`.babelCompile[${index}].moduleTarget must be a string`)
      }
      if (babelConfig.inputDir.constructor !== String) {
        throw new Error(`.babelCompile[${index}].inputDir must be a string`)
      }
      if (babelConfig.outDir.constructor !== String) {
        throw new Error(`.babelCompile[${index}].outDir must be a string`)
      }

      babelConfig.inputDir = path.join(config.directory, babelConfig.inputDir)
      babelConfig.outDir = path.join(config.directory, babelConfig.outDir)
      babelConfig.outFileExtension =
        babelConfig.moduleType === 'mjs' ? '.mjs' : '.js'

      babelConfig.extensions =
        config.sourceType === 'ts'
          ? ['.ts', '.tsx', '.js', '.jsx']
          : ['.js', '.jsx']

      babelConfig.deleteDirOnStart = false
      babelConfig.filenames = [babelConfig.inputDir]
    }

    entry.config = config
  })

  return registry
}

module.exports = { getCompileConfigs }
