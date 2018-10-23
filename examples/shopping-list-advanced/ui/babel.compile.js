const babel = require('@babel/cli/lib/babel/dir').default

function getConfig({ moduleType }) {
  let useESModules, modules
  const loose = true, regenerator = true, helpers = false

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

  return {
    presets: [
      [
        '@babel/preset-env',
        {
          loose,
          modules
        }
      ],
      '@babel/preset-react'
    ],
    plugins: [
      '@babel/plugin-proposal-class-properties',
      '@babel/plugin-proposal-export-default-from',
      '@babel/plugin-proposal-export-namespace-from',
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

const configs = [
  {
    "moduleType": "cjs",
    "inputDir": "./src",
    "outDir": "./lib"
  },
  {
    "moduleType": "es",
    "inputDir": "./src",
    "outDir": "./es"
  }
]

for (const config of configs) {
  babel({
    babelOptions: {
      ...getConfig({
        moduleType: config.moduleType
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
        `↑ { moduleType: "${
          config.moduleType
        }" }`
      )
    })
    .catch(error => {
      // eslint-disable-next-line no-console
      console.error(error)
      process.exit(1)
    })
}
