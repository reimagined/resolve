import fs from 'fs'
import fsExtra from 'fs-extra'
import path from 'path'
import respawn from 'respawn'
import webpack from 'webpack'

import setup from './setup'
import getMockServer from './get_mock_server'
import showBuildInfo from './show_build_info'
import getWebpackConfigs from './get_webpack_configs'
import getResolveBuildConfig from './get_resolve_build_config'

const writePackageJsonsForAssemblies = (distDir, nodeModulesByAssembly) => {
  const applicationPackageJson = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'package.json'))
  )

  for (const [
    assemblyPackageJsonPath,
    nodeModulesSet
  ] of nodeModulesByAssembly.entries()) {
    const filePath = path.join(process.cwd(), distDir, assemblyPackageJsonPath)

    const syntheticName = assemblyPackageJsonPath
      .replace('/package.json', '')
      .replace(/[^\w\d-]/g, '-')

    const assemblyPackageJson = {
      name: `${applicationPackageJson.name}-${syntheticName}`,
      private: true,
      version: applicationPackageJson.version,
      main: './index.js',
      dependencies: Array.from(nodeModulesSet).reduce((acc, val) => {
        acc[val] = applicationPackageJson.dependencies[val]
        return acc
      }, {})
    }

    fs.writeFileSync(filePath, JSON.stringify(assemblyPackageJson, null, 2))
  }
}

export default argv => {
  const { resolveConfig, deployOptions, env } = setup(argv)

  if (argv.printConfig) {
    // eslint-disable-next-line
    console.log(
      JSON.stringify(
        {
          ...resolveConfig,
          deployOptions
        },
        null,
        3
      )
    )
    return
  }

  const resolveBuildConfig = getResolveBuildConfig(argv, env)

  const nodeModulesByAssembly = new Map()

  const webpackConfigs = getWebpackConfigs({
    resolveConfig,
    deployOptions,
    env,
    resolveBuildConfig,
    nodeModulesByAssembly
  })

  const compiler = webpack(webpackConfigs)

  const serverPath = path.resolve(__dirname, '../../dist/runtime/index.js')

  if (
    deployOptions.start &&
    !fs.existsSync(
      path.join(process.cwd(), resolveConfig.distDir, './assemblies.js')
    )
  ) {
    deployOptions.build = true
  }

  const server = deployOptions.start
    ? respawn([serverPath], {
        maxRestarts: 0,
        kill: 5000,
        stdio: 'inherit',
        fork: true
      })
    : getMockServer()

  process.on('exit', () => {
    server.stop()
  })

  process.env.RESOLVE_SERVER_FIRST_START = 'true'
  if (deployOptions.build) {
    fsExtra.copySync(
      path.resolve(process.cwd(), resolveConfig.staticDir),
      path.resolve(process.cwd(), resolveConfig.distDir, './client')
    )

    if (deployOptions.watch) {
      const stdin = process.openStdin()
      stdin.addListener('data', data => {
        if (data.toString().indexOf('rs') !== -1) {
          process.env.RESOLVE_SERVER_FIRST_START = 'false'
          server.stop(() => server.start())
        }
      })
      compiler.watch(
        {
          aggregateTimeout: 1000,
          poll: 1000
        },
        (err, { stats }) => {
          stats.forEach(showBuildInfo.bind(null, err))

          writePackageJsonsForAssemblies(
            resolveConfig.distDir,
            nodeModulesByAssembly
          )

          if (deployOptions.start) {
            const hasErrors = stats.reduce(
              (acc, val) => acc || (val != null && val.hasErrors()),
              false
            )
            if (hasErrors) {
              server.stop()
            } else {
              if (server.status === 'running') {
                process.env.RESOLVE_SERVER_FIRST_START = 'false'
                server.stop(() => server.start())
              } else {
                server.start()
              }
            }
          }
        }
      )
    } else {
      compiler.run((err, { stats }) => {
        stats.forEach(showBuildInfo.bind(null, err))

        writePackageJsonsForAssemblies(
          resolveConfig.distDir,
          nodeModulesByAssembly
        )

        if (deployOptions.start) {
          const hasNoErrors = stats.reduce(
            (acc, val) => acc && (val != null && !val.hasErrors()),
            true
          )
          if (hasNoErrors) {
            server.start()
          }
        }
      })
    }
  } else {
    server.start()
  }
}
