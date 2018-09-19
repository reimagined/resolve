import { getInstallations } from 'testcafe-browser-tools'
import { execSync } from 'child_process'
import fetch from 'isomorphic-fetch'
import path from 'path'
import respawn from 'respawn'
import fsExtra from 'fs-extra'
import webpack from 'webpack'

import getWebpackConfigs from './get_webpack_configs'
import writePackageJsonsForAssemblies from './write_package_jsons_for_assemblies'
import showBuildInfo from './show_build_info'
import copyEnvToDist from './copy_env_to_dist'
import validateConfig from './validate_config'

const runTestcafe = async ({
  resolveConfig,
  adjustWebpackConfigs,
  functionalTestsDir,
  browser,
  timeout
}) => {
  validateConfig(resolveConfig)

  const nodeModulesByAssembly = new Map()

  const webpackConfigs = await getWebpackConfigs({
    resolveConfig,
    nodeModulesByAssembly,
    adjustWebpackConfigs
  })

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
        nodeModulesByAssembly
      )

      copyEnvToDist(resolveConfig.distDir)

      const hasNoErrors = stats.reduce(
        (acc, val) => acc && (val != null && !val.hasErrors()),
        true
      )

      void (hasNoErrors ? resolve() : reject(err))
    })
  })

  const serverPath = path.resolve(__dirname, '../../lib/runtime/index.js')

  const server = respawn(
    ['node', serverPath, `--distDir=${JSON.stringify(resolveConfig.distDir)}`],
    {
      maxRestarts: 0,
      kill: 5000,
      stdio: 'inherit'
    }
  )

  process.on('exit', () => {
    server.stop()
  })

  server.start()

  while (true) {
    const statusUrl = `http://localhost:${resolveConfig.port}${
      resolveConfig.rootPath ? `/${resolveConfig.rootPath}` : ''
    }/api/status`
    try {
      const response = await fetch(statusUrl)
      if ((await response.text()) === 'ok') break
    } catch (e) {}
  }

  const targetBrowser =
    browser == null ? Object.keys(await getInstallations())[0] : browser
  const targetTimeout = timeout == null ? 20000 : timeout

  let status = 0
  try {
    execSync(
      `npx testcafe ${targetBrowser}` +
        ` ${functionalTestsDir}` +
        ` --app-init-delay ${targetTimeout}` +
        ` --selector-timeout ${targetTimeout}` +
        ` --assertion-timeout ${targetTimeout}` +
        ` --page-load-timeout ${targetTimeout}` +
        (targetBrowser === 'remote' ? ' --qr-code' : ''),
      { stdio: 'inherit' }
    )
  } catch (error) {
    status = 1
    // eslint-disable-next-line no-console
    console.error(error.message)
  } finally {
    server.stop(() => {
      process.exit(status)
    })
  }
}

export default runTestcafe
