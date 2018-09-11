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
      throw new Error('process.env.MODULE_TARGET must be one of ["server", "client"]')
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

module.exports = function(api) {
  const moduleType = process.env.MODULE_TYPE
  const moduleTarget = process.env.MODULE_TARGET
  
  api.cache.using(
    () => moduleType + ':' + moduleTarget
  )

  return getConfig({ moduleType, moduleTarget })
}

module.exports.getConfig = getConfig
