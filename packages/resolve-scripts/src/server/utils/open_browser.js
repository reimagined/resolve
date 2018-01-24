import chalk from 'chalk'
import { execSync } from 'child_process'
import spawn from 'cross-spawn'
import opn from 'opn'

// eslint-disable-next-line no-console
const log = console.log

var OSX_CHROME = 'google chrome'

const Actions = Object.freeze({
  NONE: 0,
  BROWSER: 1,
  SCRIPT: 2
})

function getBrowserEnv() {
  const value = process.env.BROWSER
  let action
  if (!value) {
    action = Actions.BROWSER
  } else if (value.toLowerCase().endsWith('.js')) {
    action = Actions.SCRIPT
  } else if (value.toLowerCase() === 'none') {
    action = Actions.NONE
  } else {
    action = Actions.BROWSER
  }
  return { action, value }
}

function executeNodeScript(scriptPath, url) {
  const extraArgs = process.argv.slice(2)
  const child = spawn('node', [scriptPath, ...extraArgs, url], {
    stdio: 'inherit'
  })
  child.on('close', code => {
    if (code !== 0) {
      log()
      log(
        chalk.red(
          'The script specified as BROWSER environment variable failed.'
        )
      )
      log(chalk.cyan(scriptPath) + ' exited with code ' + code + '.')
      log()
      return
    }
  })
  return true
}

function startBrowserProcess(browser, url) {
  const shouldTryOpenChromeWithAppleScript =
    process.platform === 'darwin' &&
    (typeof browser !== 'string' || browser === OSX_CHROME)

  if (shouldTryOpenChromeWithAppleScript) {
    try {
      execSync('ps cax | grep "Google Chrome"')
      execSync('osascript openChrome.applescript "' + encodeURI(url) + '"', {
        cwd: __dirname,
        stdio: 'ignore'
      })
      return true
    } catch (err) {
      // Ignore errors.
    }
  }

  if (process.platform === 'darwin' && browser === 'open') {
    // eslint-disable-next-line no-param-reassign
    browser = undefined
  }

  try {
    var options = { app: browser }
    opn(url, options).catch(() => {})
    return true
  } catch (err) {
    return false
  }
}

function openBrowser(url) {
  const { action, value } = getBrowserEnv()
  switch (action) {
    case Actions.NONE:
      return false
    case Actions.SCRIPT:
      return executeNodeScript(value, url)
    case Actions.BROWSER:
      return startBrowserProcess(value, url)
    default:
      throw new Error('Not implemented.')
  }
}

export default openBrowser
