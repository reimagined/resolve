import { message } from '../constants'
import { checkRuntimeEnv } from '../declare_runtime_env'

import getClientGlobalObject from '../client_global_object'

export default ({ resolveConfig, isClient }) => {
  if (!resolveConfig.logLevel == null) {
    throw new Error(`${message.configNotContainSectionError}.logLevel`)
  }
  if (checkRuntimeEnv(resolveConfig.logLevel)) {
    throw new Error(`${message.clientEnvError}.logLevel`)
  }
  const exports = []

  if (resolveConfig.logLevel !== 'off') {
    exports.push(`const logLevel = ${JSON.stringify(resolveConfig.logLevel)}`)
    exports.push(`const logLevelsMap = new Map([
      ['error', 0], ['warn', 1], ['debug', 2], ['debug', 3], ['trace', 4]
    ])`)
    exports.push(`const logLevelNumber = logLevelsMap.get(logLevel)`)

    if (isClient) {
      exports.push(`const globalObject = ${getClientGlobalObject()}`)
    } else {
      exports.push(`const globalObject = global`)
    }

    exports.push(
      `const globalConsole = globalObject.console`,
      `const loggers = [`,
      `  globalConsole.error.bind(globalConsole),`,
      `  globalConsole.warn.bind(globalConsole),`,
      `  globalConsole.info.bind(globalConsole),`,
      `  globalConsole.debug.bind(globalConsole),`,
      `  globalConsole.trace.bind(globalConsole)`,
      `]`,
      `globalObject.resolveLog = (level, ...args) => {`,
      `  const levelNumber = +logLevelsMap.get(level)`,
      `  if (!isNaN(levelNumber) && levelNumber <= logLevelNumber) {`,
      `    loggers[levelNumber](...args)`,
      `  }`,
      `}`
    )
  }

  exports.push(`export default null`)

  return {
    code: exports.join('\r\n')
  }
}
