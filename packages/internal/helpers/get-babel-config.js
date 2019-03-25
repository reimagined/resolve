const { getResolvePackages } = require('./get-resolve-packages')
const { getResolveExamples } = require('./get-resolve-examples')

const getBabelConfig = ({ moduleType, moduleTarget }) => {
  const resolvePackages = getResolvePackages()
  const resolveExamples = getResolveExamples()

  process.env.__RESOLVE_PACKAGES__ = JSON.stringify(resolvePackages)
  process.env.__RESOLVE_EXAMPLES__ = JSON.stringify(resolveExamples)
  process.env.__RESOLVE_VERSION__ = require('../babel-compile/package').version

  let useESModules,
    regenerator,
    helpers,
    modules,
    targets,
    loose,
    forceAllTransforms = false

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
      throw new Error('"moduleType" must be one of ["cjs", "es"]')
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
      forceAllTransforms = true
      break
    }
    default: {
      throw new Error('"moduleTarget" must be one of ["server", "client"]')
    }
  }

  return {
    presets: [
      [
        '@babel/preset-env',
        {
          loose,
          targets,
          forceAllTransforms,
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
      ],
      [
        'transform-inline-environment-variables',
        {
          include: [
            '__RESOLVE_PACKAGES__',
            '__RESOLVE_EXAMPLES__',
            '__RESOLVE_VERSION__'
          ]
        }
      ]
    ]
  }
}

module.exports = { getBabelConfig }
