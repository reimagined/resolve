import { isV4Format } from 'ip'

import deployOptionsOrigin from '../configs/deploy.options'
import resolveFile from './resolve_file'

export const extenders = []

extenders.push(mode)
export function mode({ deployOptions }, argv, env) {
  if (
    env.NODE_ENV &&
    ['development', 'production', 'test'].indexOf(env.NODE_ENV) !== -1
  ) {
    deployOptions.mode =
      env.NODE_ENV === 'production' ? 'production' : 'development'
  } else if (env.NODE_ENV) {
    throw new Error(
      'Invalid environment variables: \n' +
        `NODE_ENV, Given: "${
          env.NODE_ENV
        }", Choices: "development", "production", "test"`
    )
  }
  if (argv.dev || argv.test) {
    deployOptions.mode = 'development'
  } else if (argv.prod) {
    deployOptions.mode = 'production'
  }
  env.NODE_ENV = deployOptions.mode
  if (argv.test) {
    env.NODE_ENV = 'test'
  }
}

extenders.push(watch)
export function watch({ deployOptions }, argv, env) {
  if (env.WATCH && ['false', 'true'].indexOf(env.WATCH) === -1) {
    return new Error(
      'Invalid environment variables: \n' +
        `WATCH, Given: "${env.WATCH}", Choices: "false", "true"`
    )
  } else if (env.WATCH) {
    deployOptions.watch = env.WATCH === 'true'
  }
  if (argv.watch) {
    deployOptions.watch = argv.watch
  }
  env.WATCH = deployOptions.watch
}

extenders.push(start)
export function start({ deployOptions }, argv, env) {
  if (env.START && ['false', 'true'].indexOf(env.START) === -1) {
    return new Error(
      'Invalid environment variables: \n' +
        `START, Given: "${env.START}", Choices: "false", "true"`
    )
  } else if (env.START) {
    deployOptions.start = env.START === 'true'
  }
  if (argv.start) {
    deployOptions.start = argv.start
  }
  env.START = deployOptions.start
}

extenders.push(build)
export function build({ deployOptions }, argv, env) {
  if (env.BUILD && ['false', 'true'].indexOf(env.BUILD) === -1) {
    return new Error(
      'Invalid environment variables: \n' +
        `BUILD, Given: "${env.BUILD}", Choices: "false", "true"`
    )
  } else if (env.BUILD) {
    deployOptions.build = env.BUILD === 'true'
  }
  if (argv.build) {
    deployOptions.build = argv.build
  }
  env.BUILD = deployOptions.build
}

extenders.push(inspect)
export function inspect({ deployOptions }, argv, env) {
  if (env.INSPECT_PORT && !Number.isInteger(+env.INSPECT_PORT)) {
    return new Error(
      'Invalid environment variables: \n' +
        `INSPECT_PORT, Given: "${env.INSPECT_PORT}", Value must be an integer`
    )
  } else if (env.INSPECT_PORT) {
    deployOptions.inspectPort = env.INSPECT_PORT
  }
  if (env.INSPECT_HOST && !isV4Format(env.INSPECT_HOST)) {
    throw new Error(
      'Invalid environment variables: \n' +
        `INSPECT_HOST, Given: "${env.INSPECT_HOST}", Value must be an IP v4"`
    )
  } else if (env.INSPECT_HOST) {
    deployOptions.inspectHost = env.INSPECT_HOST
  }

  if ((argv.inspect === '' || argv.inspect) && !deployOptions.start) {
    throw new Error('Implications failed:\ninspect -> start')
  }

  if (argv.inspect !== undefined) {
    const inspectArgs = argv.inspect.split(':')
    if (inspectArgs.length === 1) {
      inspectArgs[1] =
        inspectArgs[0] || env.INSPECT_PORT || deployOptionsOrigin.inspectPort
      inspectArgs[0] = env.INSPECT_HOST || deployOptionsOrigin.inspectHost
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
  env.INSPECT_HOST = deployOptions.inspectHost
  env.INSPECT_PORT = deployOptions.inspectPort
}

extenders.push(host)
export function host({ deployOptions }, argv, env) {
  if (env.HOST) {
    deployOptions.host = env.HOST
  }
  if (argv.host) {
    deployOptions.host = argv.host
  }
  env.HOST = deployOptions.host
}

extenders.push(protocol)
export function protocol({ deployOptions }, argv, env) {
  if (env.PROTOCOL) {
    deployOptions.protocol = env.PROTOCOL
  }
  if (argv.protocol) {
    deployOptions.protocol = argv.protocol
  }
  env.PROTOCOL = deployOptions.protocol
}

extenders.push(port)
export function port({ deployOptions }, argv, env) {
  if (env.PORT && !Number.isInteger(+env.PORT)) {
    throw new Error(
      'Invalid environment variables: \n' +
        `PORT, Given: "${argv.port}", Value must be an integer`
    )
  } else if (env.PORT) {
    deployOptions.port = +env.PORT
  }
  if (argv.port && !Number.isInteger(+argv.port)) {
    throw new Error(
      'Invalid options: \n' +
        `port, Given: "${argv.port}", Value must be an integer`
    )
  } else if (argv.port) {
    deployOptions.port = +argv.port
  }
  env.PORT = deployOptions.port
}

extenders.push(rootPath)
export function rootPath({ resolveConfig }, argv, env) {
  if (env.ROOT_PATH) {
    resolveConfig.rootPath = env.ROOT_PATH
  }
  if (argv.rootPath) {
    resolveConfig.rootPath = argv.rootPath
  }

  if (resolveConfig.rootPath && /^https?:\/\//.test(resolveConfig.rootPath)) {
    return new Error('Incorrect env.ROOT_PATH or cli.rootPath')
  }

  if (!/^\//.test(resolveConfig.rootPath)) {
    resolveConfig.rootPath = `/${resolveConfig.rootPath}`
  }

  env.ROOT_PATH = resolveConfig.rootPath
}

extenders.push(index)
export function index({ resolveConfig }, argv, env) {
  if (env.INDEX_PATH) {
    resolveConfig.index = env.INDEX_PATH
  }
  if (argv.index) {
    resolveConfig.index = argv.index
  }
  env.INDEX_PATH = resolveConfig.index
}

extenders.push(viewModels)
export function viewModels({ resolveConfig }, argv, env) {
  if (env.VIEW_MODELS_PATH) {
    resolveConfig.viewModels = env.VIEW_MODELS_PATH
  }
  env.VIEW_MODELS_PATH = resolveConfig.viewModels
}

extenders.push(readModels)
export function readModels({ resolveConfig }, argv, env) {
  if (env.READ_MODELS_PATH) {
    resolveConfig.readModels = env.READ_MODELS_PATH
  }
  env.READ_MODELS_PATH = resolveConfig.readModels
}

extenders.push(aggregates)
export function aggregates({ resolveConfig }, argv, env) {
  if (env.AGGREGATES_PATH) {
    resolveConfig.aggregates = env.AGGREGATES_PATH
  }
  env.AGGREGATES_PATH = resolveConfig.aggregates
}

extenders.push(auth)
export function auth({ resolveConfig }, argv, env) {
  if (env.AUTH_PATH) {
    resolveConfig.auth = env.AUTH_PATH
  }
  env.AUTH_PATH = resolveConfig.auth
}

extenders.push(openBrowser)
export function openBrowser({ deployOptions }, argv, env) {
  if (env.OPEN_BROWSER && ['false', 'true'].indexOf(env.OPEN_BROWSER) === -1) {
    return new Error(
      'Invalid environment variables: \n' +
        `OPEN_BROWSER, Given: "${env.BUILD}", Choices: "false", "true"`
    )
  } else if (env.OPEN_BROWSER) {
    deployOptions.openBrowser = env.OPEN_BROWSER === 'true'
  }
  if (argv.openBrowser !== undefined) {
    deployOptions.openBrowser = argv.openBrowser
  }
  env.OPEN_BROWSER = deployOptions.openBrowser
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
export function browser({ deployOptions }, argv, env) {
  if (env.TESTCAFE_BROWSER) {
    deployOptions.browser = env.TESTCAFE_BROWSER
  }
  if (argv.browser) {
    deployOptions.browser = argv.browser
  }
  env.TESTCAFE_BROWSER = deployOptions.browser
}

extenders.push(env)
export function env({ resolveConfig, deployOptions }, argv) {
  let envKey = deployOptions.mode
  if (argv.test) {
    envKey = 'test'
  }

  if (resolveConfig.env && resolveConfig.env[envKey]) {
    const envConfig = resolveConfig.env[envKey]
    Object.assign(resolveConfig, envConfig)
  }
  delete resolveConfig.env
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
