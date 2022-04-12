import { getInstallations } from 'testcafe-browser-tools'
import { execSync } from 'child_process'
import { getLog } from './get-log'

import merge from './merge'
import generateCustomMode from './generate_custom_mode'
import { getResetDomainConfig } from './reset_mode'

const getConfig = async (resolveConfig, options) => {
  if (options == null || options.constructor !== Object) {
    throw new Error('Invalid run-testcafe options')
  }

  const {
    functionalTestsDir,
    browser,
    customArgs,
    timeout,
    resetDomainOptions,
  } = options
  if (functionalTestsDir == null || functionalTestsDir.constructor !== String) {
    throw new Error('Options field "functionalTestsDir" must be a string')
  }

  if (browser != null && browser.constructor !== String) {
    throw new Error('Options field "browser" must be a string or null')
  }

  if (timeout != null && timeout.constructor !== Number) {
    throw new Error('Options field "timeout" must be a number or null')
  }

  if (customArgs != null && !Array.isArray(customArgs)) {
    throw new Error('Options field "customArgs" must be an array of strings')
  }

  let config = merge(resolveConfig, {
    apiHandlers: [
      {
        handler: {
          package: '@resolve-js/runtime-base',
          import: 'queryIsReadyHandler',
        },
        path: '/api/query-is-ready',
        method: 'GET',
      },
    ],
  })
  if (resetDomainOptions != null) {
    config = getResetDomainConfig(config, resetDomainOptions)
  }

  return config
}

const runAfterLaunch = async (options) => {
  const log = getLog('run-testcafe')
  let { functionalTestsDir, browser, customArgs, timeout } = options
  browser =
    browser ||
    process.env.RESOLVE_E2E_TESTS_BROWSER ||
    Object.keys(await getInstallations())[0]
  timeout = timeout != null ? timeout : 20000
  customArgs = customArgs != null ? customArgs : []

  const headlessMode = ['true', 'yes', '1'].includes(
    process.env.RESOLVE_E2E_TESTS_HEADLESS_MODE
  )

  log.debug(`headlessMode: ${headlessMode}`)
  log.debug(`dir: ${functionalTestsDir}`)
  log.debug(`browser: ${browser}`)
  log.debug(`timeout: ${timeout}`)
  log.debug(`custom args: ${customArgs}`)

  const xvfbCommand = headlessMode
    ? `xvfb-run --server-args="-screen 0 1280x720x24"`
    : ''

  try {
    log.info(`executing testcafe runner`)
    return execSync(
      [
        xvfbCommand,
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
  resetDomainOptions = null,
}) => {
  let apiHandlers = [`query-is-ready`]
  if (resetDomainOptions != null) {
    apiHandlers = ['reset-domain'].concat(apiHandlers)
  }
  return generateCustomMode(getConfig, apiHandlers, runAfterLaunch)(
    resolveConfig,
    {
      functionalTestsDir,
      browser,
      customArgs,
      timeout,
      resetDomainOptions,
    },
    adjustWebpackConfigs
  )
}

export default runTestcafeMode
