import path from 'path'
import getModulesDirs from 'resolve-scripts/dist/core/get_modules_dirs'
import getWebpackEnvPlugin from 'resolve-scripts/dist/core/get_webpack_env_plugin'
import { execSync } from 'child_process'
import { getInstallations } from 'testcafe-browser-tools'
import {
  defaultResolveConfig,
  build,
  start,
  watch,
  startWaitReady
} from 'resolve-scripts'

const adjustWebpackConfigs = (
  resolveConfig,
  webpackConfigs,
  { alias: _alias }
) => {
  const alias = {
    ..._alias,
    '$resolve.businessLogic': path.resolve(
      __dirname,
      'core/alias/$resolve.businessLogic.js'
    ),
    '$resolve.resolveRedux': path.resolve(
      __dirname,
      'core/alias/$resolve.resolveRedux.js'
    )
  }

  const isClient = true

  webpackConfigs.push({
    name: 'Common Business Logic',
    entry: {
      'resolve/config.js': ['$resolve.businessLogic'],
      'resolve/resolve-redux.js': ['$resolve.resolveRedux']
    },
    context: path.resolve(process.cwd()),
    mode: resolveConfig.mode,
    performance: false,
    devtool: 'source-map',
    target: 'web',
    output: {
      path: path.resolve(process.cwd(), '../native'),
      filename: '[name]',
      libraryTarget: 'commonjs-module',
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
      devtoolFallbackModuleFilenameTemplate: '[absolute-resource-path]?[hash]'
    },
    resolve: {
      modules: getModulesDirs(),
      alias
    },
    module: {
      rules: [
        {
          test: /core(\/|\\)alias(\/|\\)\$resolve.\w+\.js/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                cacheDirectory: true
              }
            },
            {
              loader: 'val-loader',
              options: {
                resolveConfig,
                isClient
              }
            }
          ]
        },
        {
          test: /\.js$/,
          use: {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true
            }
          }
        }
      ]
    },
    plugins: [getWebpackEnvPlugin()]
  })
}

const config = {
  ...defaultResolveConfig,
  port: 3000,
  routes: 'client/routes.js',
  aggregates: [
    {
      name: 'Todo',
      commands: 'common/aggregates/todo.commands.js'
    }
  ],
  viewModels: [
    {
      name: 'Todos',
      projection: 'common/view-models/todos.projection.js'
    }
  ]
}

async function main() {
  const launchMode = process.argv[2]

  switch (launchMode) {
    case 'dev': {
      const devConfig = {
        ...config,
        mode: 'development'
      }
      await watch(devConfig, adjustWebpackConfigs.bind(null, devConfig))
      break
    }

    case 'build': {
      const buildConfig = {
        ...config,
        mode: 'production'
      }
      await build(buildConfig, adjustWebpackConfigs.bind(null, buildConfig))
      break
    }

    case 'start': {
      const stopServer = await start(config)
      process.on('exit', stopServer)
      break
    }

    case 'test:functional': {
      const testFunctionalConfig = {
        ...config,
        storageAdapter: {
          module: 'resolve-storage-lite',
          options: {}
        },
        mode: 'development'
      }

      await build(
        testFunctionalConfig,
        adjustWebpackConfigs.bind(null, testFunctionalConfig)
      )

      const stopServer = await startWaitReady(testFunctionalConfig)
      process.on('exit', stopServer)

      const browser = !process.argv[3]
        ? Object.keys(await getInstallations())[0]
        : process.argv[3]
      const TIMEOUT = 20000

      execSync(
        `npx testcafe ${browser}` +
          ' test/functional' +
          ` --app-init-delay ${TIMEOUT}` +
          ` --selector-timeout ${TIMEOUT}` +
          ` --assertion-timeout ${TIMEOUT}` +
          ` --page-load-timeout ${TIMEOUT}` +
          (browser === 'remote' ? ' --qr-code' : ''),
        { stdio: 'inherit' }
      )

      await stopServer()

      break
    }

    default: {
      throw new Error('Unknown option')
    }
  }
}

main().catch(error => {
  // eslint-disable-next-line no-console
  console.log(error)
})
