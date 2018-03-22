import path from 'path'
import { getInstallations } from 'testcafe-browser-tools'
import { execSync, spawn } from 'child_process'
import fetch from 'isomorphic-fetch'

import assignConfigPaths from './utils/assign_config_paths'
import resolveFileOrModule from './utils/resolve_file_or_module'
import setup from './utils/setup'

const testCafeRunner = async argv => {
  execSync(
    `node ` +
      path.resolve(__dirname, '../bin/resolve-scripts.js') +
      ' build' +
      ' --test',
    { stdio: 'inherit' }
  )

  const { resolveConfig, deployOptions } = setup(argv, process.env)

  assignConfigPaths(resolveConfig)

  const TIMEOUT = 20000

  const browsers = await getInstallations()

  const browser = argv.browser || Object.keys(browsers).slice(0, 1)

  const application = spawn(
    'node',
    [`${resolveConfig.distDir}/server/server.js`],
    { stdio: 'inherit' }
  )

  while (true) {
    try {
      const response = await fetch(
        `${deployOptions.protocol}://${deployOptions.host}:${
          deployOptions.port
        }/api/status`
      )
      if ((await response.text()) === 'ok') break
    } catch (e) {}
  }

  const testcafe = spawn(
    'node',
    [
      path.resolve(resolveFileOrModule('testcafe'), '../../bin/testcafe.js'),
      browser,
      'test/functional',
      `--app-init-delay ${TIMEOUT}`,
      `--selector-timeout ${TIMEOUT}`,
      `--assertion-timeout ${TIMEOUT}`,
      `--page-load-timeout ${TIMEOUT}`
    ],
    { stdio: 'inherit' }
  )
  testcafe.on('close', exitCode => {
    application.kill('SIGINT')
    process.exit(exitCode)
  })
}

export default testCafeRunner
