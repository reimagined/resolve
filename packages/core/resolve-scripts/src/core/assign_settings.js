import Url from 'url'
import { isV4Format } from 'ip'

import { deployOptions as deployOptionsOrigin } from './constants'
import resolveFile from './resolve_file'

export const extenders = []

extenders.push(mode)
export function mode({ deployOptions }, argv) {
  if (argv.dev) {
    deployOptions.mode = 'development'
  } else if (argv.prod) {
    deployOptions.mode = 'production'
  }
  if (argv.test) {
    deployOptions.test = true
  }
}

extenders.push(env)
export function env({ resolveConfig, deployOptions }) {
  let envKey = deployOptions.test ? 'test' : deployOptions.mode

  if (resolveConfig.env && resolveConfig.env[envKey]) {
    const envConfig = resolveConfig.env[envKey]
    Object.assign(resolveConfig, envConfig)
  }
  delete resolveConfig.env
}

extenders.push(watch)
export function watch({ deployOptions }, argv) {
  if (argv.watch) {
    deployOptions.watch = argv.watch
  }
}

extenders.push(start)
export function start({ deployOptions }, argv) {
  if (argv.start) {
    deployOptions.start = argv.start
  }
}

extenders.push(build)
export function build({ deployOptions }, argv) {
  if (argv.build) {
    deployOptions.build = argv.build
  }
}

extenders.push(inspect)
export function inspect({ deployOptions }, argv) {
  if ((argv.inspect === '' || argv.inspect) && !deployOptions.start) {
    throw new Error('Implications failed:\ninspect -> start')
  }

  if (argv.inspect !== undefined) {
    const inspectArgs = argv.inspect.split(':')
    if (inspectArgs.length === 1) {
      inspectArgs[1] = inspectArgs[0] || deployOptionsOrigin.inspectPort
      inspectArgs[0] = deployOptionsOrigin.inspectHost
    }
    const [ip, port] = inspectArgs
    deployOptions.inspectHost = ip
    deployOptions.inspectPort = +port
    if (
      !Number.isInteger(deployOptions.inspectPort) ||
      !isV4Format(deployOptions.inspectHost)
    ) {
      throw new Error(
        'Invalid options: \n' +
          `inspect, Given: "${argv.inspect}", Value must be "[[IP v4:]PORT]"`
      )
    }
  }
}

extenders.push(port)
export function port({ resolveConfig }, argv) {
  if (argv.port && !Number.isInteger(+argv.port)) {
    throw new Error(
      'Invalid options: \n' +
        `port, Given: "${argv.port}", Value must be an integer`
    )
  } else if (argv.port) {
    resolveConfig.port = +argv.port
  }
}

extenders.push(rootPath)
export function rootPath({ resolveConfig }, argv) {
  if (argv.rootPath) {
    resolveConfig.rootPath = argv.rootPath
  }

  const {
    protocol,
    slashes,
    auth,
    host,
    port,
    hostname,
    hash,
    search,
    query,
    path
  } = Url.parse(resolveConfig.rootPath)

  if (
    protocol ||
    slashes ||
    auth ||
    host ||
    port ||
    hostname ||
    hash ||
    search ||
    query ||
    /^\//.test(path) ||
    /\/$/.test(path)
  ) {
    throw new Error(
      `Incorrect options.rootPath = "${
        resolveConfig.rootPath
      }"\nValue must be part of the URL, which is the application's subdirectory`
    )
  }

  resolveConfig.rootPath = encodeURI(resolveConfig.rootPath)
}

extenders.push(staticPath)
export function staticPath({ resolveConfig }, argv) {
  if (argv.staticPath) {
    resolveConfig.staticPath = argv.staticPath
  }

  const {
    protocol,
    slashes,
    auth,
    host,
    port,
    hostname,
    hash,
    search,
    query,
    path
  } = Url.parse(resolveConfig.staticPath)

  if (
    protocol ||
    slashes ||
    auth ||
    host ||
    port ||
    hostname ||
    hash ||
    search ||
    query ||
    /^\//.test(path) ||
    /\/$/.test(path) ||
    path === ''
  ) {
    throw new Error(
      `Incorrect options.staticPath = "${
        resolveConfig.staticPath
      }"\nValue must be part of the URL, which is the application's static subdirectory`
    )
  }

  resolveConfig.staticPath = encodeURI(resolveConfig.staticPath)
}

extenders.push(index)
export function index({ resolveConfig }, argv) {
  if (argv.index) {
    resolveConfig.index = argv.index
  }
}

extenders.push(openBrowser)
export function openBrowser({ deployOptions }, argv) {
  if (argv.openBrowser !== undefined) {
    deployOptions.openBrowser = argv.openBrowser
  }
}

extenders.push(useYarn)
export function useYarn({ deployOptions }, argv, env) {
  deployOptions.useYarn =
    (env.npm_config_user_agent && env.npm_config_user_agent.includes('yarn')) ||
    (env.npm_execpath && env.npm_execpath.includes('yarn'))
}

extenders.push(applicationName)
export function applicationName({ deployOptions }) {
  const { name } = require(resolveFile('package.json'))
  deployOptions.applicationName = name
}

extenders.push(browser)
export function browser({ deployOptions }, argv) {
  if (argv.browser) {
    deployOptions.browser = argv.browser
  }
}

export default function assignSettings(
  { resolveConfig, deployOptions },
  argv,
  env
) {
  for (const extender of extenders) {
    extender({ resolveConfig, deployOptions }, argv, env)
  }
}
