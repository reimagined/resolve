const path = require('path')
const chalk = require('chalk')
const find = require('glob').sync
const babel = require('@babel/cli/lib/babel/dir').default

function getBabelConfig() {
  return {
    presets: [
      [
        '@babel/preset-env',
        {
          loose: true,
          modules: 'commonjs'
        }
      ],
      '@babel/preset-react'
    ],
    plugins: [
      ['@babel/plugin-proposal-decorators', { legacy: true }],
      '@babel/plugin-proposal-class-properties',
    
      '@babel/plugin-proposal-export-default-from',
      '@babel/plugin-proposal-export-namespace-from',
      '@babel/plugin-proposal-object-rest-spread', [
        '@babel/plugin-transform-runtime',
        {
          corejs: false,
          helpers: true,
          regenerator: true,
          useESModules: false
        }
      ]
    ]
  }
}

function babelify({ watch = false } = {}) {
  const files = find('../*/package.json', { cwd: __dirname, absolute: true })

  const configs = []

  for (const filePath of files) {
    if (filePath.includes('node_modules')) {
      continue
    }

    const { name } = require(filePath)

    configs.push({
      name,
      inputDir: path.resolve(path.dirname(filePath), './src'),
      outDir: path.resolve(path.dirname(filePath), './lib')
    })
  }

  return Promise.all(
    configs.map(
      config => babel({
        babelOptions: {
          ...getBabelConfig(),
          sourceMaps: true,
          babelrc: false
        },
        cliOptions: {
          filenames: [config.inputDir],
          outDir: config.outDir,
          deleteDirOnStart: true,
          watch
        }
      })
        .then(() => {
          // eslint-disable-next-line no-console
          console.log(chalk.green(
            `↑ [${config.name}]`
          ))
        })
    )
  )
}

if (process.argv[2] === '--run') {
  babelify().catch(error => {
    // eslint-disable-next-line no-console
    console.error(error)
    process.exit(1)
  })
} else if (process.argv[2] === '--watch') {
  babelify({ watch: true }).catch(error => {
    // eslint-disable-next-line no-console
    console.error(error)
    process.exit(1)
  })
}

module.exports.getBabelConfig = getBabelConfig
module.exports.babelify = babelify
