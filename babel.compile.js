const path = require('path')
const find = require('glob').sync
const babel = require('@babel/cli/lib/babel/dir').default

function getConfig({ moduleType, moduleTarget }) {
  let useESModules, regenerator, helpers, modules, targets, loose

  switch (moduleType) {
    case 'cjs': {
      modules = 'commonjs'
      useESModules = false
      break
    }
    case 'es': {
      modules = 'false'
      useESModules = true
      break
    }
    default: {
      throw new Error('process.env.MODULE_TYPE must be one of ["cjs", "es"]')
    }
  }

  switch (moduleTarget) {
    case 'server': {
      loose = false
      regenerator = false
      helpers = false
      targets = {
        node: '8.10'
      }
      break
    }
    case 'client': {
      loose = true
      regenerator = true
      helpers = true
      break
    }
    default: {
      throw new Error(
        'process.env.MODULE_TARGET must be one of ["server", "client"]'
      )
    }
  }

  return {
    presets: [
      [
        '@babel/preset-env',
        {
          loose,
          targets,
          modules
        }
      ],
      '@babel/preset-react'
    ],
    plugins: [
      ['@babel/plugin-proposal-decorators', { legacy: true }],
      '@babel/plugin-proposal-class-properties',
      '@babel/plugin-proposal-do-expressions',
      '@babel/plugin-proposal-export-default-from',
      '@babel/plugin-proposal-export-namespace-from',
      '@babel/plugin-proposal-function-bind',
      '@babel/plugin-proposal-function-sent',
      '@babel/plugin-proposal-json-strings',
      '@babel/plugin-proposal-logical-assignment-operators',
      '@babel/plugin-proposal-nullish-coalescing-operator',
      '@babel/plugin-proposal-numeric-separator',
      '@babel/plugin-proposal-optional-chaining',
      '@babel/plugin-proposal-object-rest-spread',
      ['@babel/plugin-proposal-pipeline-operator', { proposal: 'minimal' }],
      '@babel/plugin-proposal-throw-expressions',
      '@babel/plugin-syntax-dynamic-import',
      '@babel/plugin-syntax-import-meta',
      [
        '@babel/plugin-transform-runtime',
        {
          corejs: false,
          helpers,
          regenerator,
          useESModules
        }
      ]
    ]
  }
}

function compile() {
  const files = find('./packages/**/package.json')

  const configs = []

  for (const filePath of files) {
    if (filePath.includes('node_modules')) {
      continue
    }

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
        ...getConfig({
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
          `↑ [${config.name}] { moduleType: "${
            config.moduleType
          }", moduleType: "${config.moduleTarget}" }`
        )
      })
      .catch(error => {
        // eslint-disable-next-line no-console
        console.error(error)
        process.exit(1)
      })
  }
}

if (process.argv[2] === '--run') {
  compile()
}

module.exports.getConfig = getConfig
module.exports.compile = compile
