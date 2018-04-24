import path from 'path'
import { getInstallations } from 'testcafe-browser-tools'
import { execSync, spawn } from 'child_process'
import fetch from 'isomorphic-fetch'

import assignConfigPaths from './assign_config_paths'
import setup from './setup'

const testCafeRunner = async argv => {
  execSync(
    `node "` +
      path.resolve(__dirname, '../../bin/resolve-scripts.js') +
      '" build' +
      ' --test',
    { stdio: 'inherit' }
  )

  const { resolveConfig } = setup(argv, process.env)

  assignConfigPaths(resolveConfig)

  const TIMEOUT = 20000

  const browsers = await getInstallations()

  const browser = argv.browser || Object.keys(browsers).slice(0, 1)

  const application = spawn(
    'node',
    [
      `${path.resolve(
        process.cwd(),
        resolveConfig.distDir,
        'server/server.js'
      )}`
    ],
    { stdio: 'inherit' }
  )
  process.on('exit', () => {
    application.kill()
  })

  const waitReadModels = setTimeout(() => {
    // eslint-disable-next-line no-console
    console.log(`Please wait. Building view/read models...`)
  }, 1000 * 5)

  while (true) {
    const statusUrl = `${resolveConfig.protocol}://${resolveConfig.host}:${
      resolveConfig.port
    }${resolveConfig.rootPath ? `/${resolveConfig.rootPath}` : ''}/api/status`
    try {
      const response = await fetch(statusUrl)
      if ((await response.text()) === 'ok') break
    } catch (e) {}
  }
  application.on('close', exitCode => {
    process.exit(exitCode)
  })

  clearTimeout(waitReadModels)

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
  application.kill()
  process.exit(0)
}

export default testCafeRunner
