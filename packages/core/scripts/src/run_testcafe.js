import { getInstallations } from 'testcafe-browser-tools'
import { execSync } from 'child_process'
import getLog from './get-log'

import merge from './merge'
import generateCustomMode from './generate_custom_mode'

const getConfig = async (resolveConfig, options) => {
  if (options == null || options.constructor !== Object) {
    throw new Error('Invalid run-testcafe options')
  }

  const { functionalTestsDir, browser, customArgs, timeout } = options
  if (functionalTestsDir == null || functionalTestsDir.constructor !== String) {
    throw new Error('Options field "functionalTestsDir" must be string')
  }

  if (browser != null && browser.constructor !== String) {
    throw new Error('Options field "browser" should be string or null')
  }

  if (timeout != null && timeout.constructor !== Number) {
    throw new Error('Options field "timeout" should be number or null')
  }

  if (customArgs != null && !Array.isArray(customArgs)) {
    throw new Error('Options field "customArgs" must be array of strings')
  }

  const config = merge(resolveConfig, {
    apiHandlers: [
      {
        handler: '@reimagined/runtime/lib/local/query-is-ready-handler.js',
        path: '/api/query-is-ready',
        method: 'GET',
      },
    ],
  })

  return config
}

const runAfterLaunch = async (options) => {
  const log = getLog('run-testcafe')
  let { functionalTestsDir, browser, customArgs, timeout } = options
  browser = browser != null ? browser : Object.keys(await getInstallations())[0]
  timeout = timeout != null ? timeout : 20000
  customArgs = customArgs != null ? customArgs : []

  log.debug(`dir: ${functionalTestsDir}`)
  log.debug(`browser: ${browser}`)
  log.debug(`timeout: ${timeout}`)
  log.debug(`custom args: ${customArgs}`)

  try {
    log.info(`executing testcafe runner`)
    return execSync(
      [
        `npx testcafe ${browser}`,
        `${functionalTestsDir}`,
        `--app-init-delay ${timeout}`,
        `--selector-timeout ${timeout}`,
        `--assertion-timeout ${timeout}`,
        `--page-load-timeout ${timeout}`,
        process.env.DEBUG_LEVEL === 'debug' ? '--dev' : '',
        browser === 'remote' ? ' --qr-code' : '',
        ...customArgs,
      ].join(' '),
      { stdio: 'inherit' }
    )
  } catch (e) {
    // eslint-disable-next-line no-throw-literal
    throw ''
  }
}

const runTestcafeMode = async ({
  resolveConfig,
  adjustWebpackConfigs,
  functionalTestsDir,
  browser,
  customArgs,
  timeout,
}) =>
  generateCustomMode(getConfig, 'query-is-ready', runAfterLaunch)(
    resolveConfig,
    {
      functionalTestsDir,
      browser,
      customArgs,
      timeout,
    },
    adjustWebpackConfigs
  )

export default runTestcafeMode
