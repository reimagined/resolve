import { getInstallations } from 'testcafe-browser-tools'
import fetch from 'isomorphic-fetch'
import path from 'path'
import fsExtra from 'fs-extra'
import webpack from 'webpack'
import { execSync } from 'child_process'

import { checkRuntimeEnv, injectRuntimeEnv } from './declare_runtime_env'
import getWebpackConfigs from './get_webpack_configs'
import writePackageJsonsForAssemblies from './write_package_jsons_for_assemblies'
import getPeerDependencies from './get_peer_dependencies'
import showBuildInfo from './show_build_info'
import copyEnvToDist from './copy_env_to_dist'
import validateConfig from './validate_config'
import { processRegister } from './process_manager'

const runTestcafe = ({
  resolveConfig,
  adjustWebpackConfigs,
  functionalTestsDir,
  browser,
  customArgs = [],
  timeout
}) =>
  new Promise(async (resolve, reject) => {
    validateConfig(resolveConfig)

    const nodeModulesByAssembly = new Map()

    const webpackConfigs = await getWebpackConfigs({
      resolveConfig,
      nodeModulesByAssembly,
      adjustWebpackConfigs
    })

    const peerDependencies = getPeerDependencies()

    const compiler = webpack(webpackConfigs)

    fsExtra.copySync(
      path.resolve(process.cwd(), resolveConfig.staticDir),
      path.resolve(process.cwd(), resolveConfig.distDir, './client')
    )

    await new Promise((resolve, reject) => {
      compiler.run((err, { stats }) => {
        stats.forEach(showBuildInfo.bind(null, err))

        writePackageJsonsForAssemblies(
          resolveConfig.distDir,
          nodeModulesByAssembly,
          peerDependencies
        )

        copyEnvToDist(resolveConfig.distDir)

        const hasNoErrors = stats.reduce(
          (acc, val) => acc && (val != null && !val.hasErrors()),
          true
        )

        void (hasNoErrors ? resolve() : reject(err))
      })
    })

    const serverPath = path.resolve(
      process.cwd(),
      path.join(resolveConfig.distDir, './common/local-entry/local-entry.js')
    )

    const server = processRegister(['node', serverPath], {
      cwd: process.cwd(),
      maxRestarts: 0,
      kill: 5000,
      stdio: 'inherit'
    })

    const brokerPath = path.resolve(
      process.cwd(),
      path.join(
        resolveConfig.distDir,
        './common/local-entry/local-bus-broker.js'
      )
    )

    const broker = processRegister(['node', brokerPath], {
      cwd: process.cwd(),
      maxRestarts: 0,
      kill: 5000,
      stdio: 'inherit'
    })

    server.on('crash', reject)
    broker.on('crash', reject)

    server.start()
    broker.start()

    const port = Number(
      checkRuntimeEnv(resolveConfig.port)
        ? // eslint-disable-next-line no-new-func
          new Function(`return ${injectRuntimeEnv(resolveConfig.port)}`)()
        : resolveConfig.port
    )

    while (true) {
      const applicationUrl = `http://localhost:${port}${
        resolveConfig.rootPath ? `/${resolveConfig.rootPath}` : ''
      }`
      try {
        await fetch(applicationUrl)
        break
      } catch (e) {}
    }

    const targetBrowser =
      browser == null ? Object.keys(await getInstallations())[0] : browser
    const targetTimeout = timeout == null ? 20000 : timeout

    try {
      execSync(
        [
          `npx testcafe ${targetBrowser}`,
          `${functionalTestsDir}`,
          `--stop-on-first-fail`,
          `--app-init-delay ${targetTimeout}`,
          `--selector-timeout ${targetTimeout}`,
          `--assertion-timeout ${targetTimeout}`,
          `--page-load-timeout ${targetTimeout}`,
          targetBrowser === 'remote' ? ' --qr-code' : '',
          ...customArgs
        ].join(' '),
        { stdio: 'inherit' }
      )
      resolve()
    } catch (e) {
      reject('')
    }
  })

export default runTestcafe
