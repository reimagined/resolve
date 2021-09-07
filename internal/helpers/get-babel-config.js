const { getResolvePackages } = require('./get-resolve-packages')
const { getResolveExamples } = require('./get-resolve-examples')

const getBabelConfig = ({ sourceType, moduleType, moduleTarget }) => {
  const resolvePackages = getResolvePackages()
  const resolveExamples = getResolveExamples()

  process.env.__RESOLVE_PACKAGES__ = JSON.stringify(resolvePackages)
  process.env.__RESOLVE_EXAMPLES__ = JSON.stringify(resolveExamples)
  process.env.__RESOLVE_VERSION__ = require('../babel-compile/package.json').version

  let useESModules,
    regenerator,
    helpers,
    modules,
    targets,
    loose,
    presets,
    forceAllTransforms = false

  switch (moduleType) {
    case 'cjs': {
      modules = 'commonjs'
      useESModules = false
      break
    }
    case 'es': {
      modules = false
      useESModules = true
      break
    }
    case 'mjs': {
      modules = false
      useESModules = true
      break
    }
    default: {
      throw new Error('"moduleType" must be one of ["cjs", "es", "mjs"]')
    }
  }

  switch (moduleTarget) {
    case 'server': {
      loose = false
      regenerator = false
      helpers = false
      targets = {
        node: '14.17',
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

  switch (sourceType) {
    case 'js': {
      presets = [
        [
          '@babel/preset-env',
          {
            loose,
            targets,
            forceAllTransforms,
            modules,
          },
        ],
        '@babel/preset-react',
      ]
      break
    }
    case 'ts': {
      presets = [
        [
          '@babel/preset-typescript',
          {
            isTSX: true,
            allExtensions: true,
          },
        ],
        [
          '@babel/preset-env',
          {
            loose,
            targets,
            forceAllTransforms,
            modules,
          },
        ],
        '@babel/preset-react',
      ]
      break
    }
    default: {
      throw new Error(
        `"sourceType" must be one of ["js", "ts"]. sourceType = ${sourceType}`
      )
    }
  }

  return {
    presets,
    plugins: [
      ['@babel/plugin-proposal-decorators', { legacy: true }],
      ['@babel/plugin-proposal-private-methods', { loose: false }],
      '@babel/plugin-proposal-class-properties',
      [
        '@babel/plugin-transform-runtime',
        {
          corejs: false,
          helpers,
          regenerator,
          useESModules,
        },
      ],
      [
        'transform-inline-environment-variables',
        {
          include: [
            '__RESOLVE_PACKAGES__',
            '__RESOLVE_EXAMPLES__',
            '__RESOLVE_VERSION__',
          ],
        },
      ],
    ],
  }
}

module.exports = { getBabelConfig }
