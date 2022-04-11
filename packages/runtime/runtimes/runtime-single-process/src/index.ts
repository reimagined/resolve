import 'source-map-support/register'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import interopRequireDefault from '@babel/runtime/helpers/interopRequireDefault'
import fs from 'fs'

import { getLog } from '@resolve-js/runtime-base'

import { initExecutor } from './init-executor'

export * from './api-handlers'
export type { RuntimeOptions } from './init-executor'

const log = getLog('single-process')

let maybeExecutorPromise: Promise<Function> | null = null

const main = async () => {
  try {
    if (maybeExecutorPromise == null) {
      const handlerPath = process.argv[2]
      if (handlerPath == null || !fs.existsSync(handlerPath)) {
        throw new Error(`Entry "${handlerPath}" is not provided`)
      }
      process.env.__RUNTIME_ENTRY_PATH = handlerPath

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const serverAssemblies = interopRequireDefault(require(handlerPath))
        .default

      const serializedOptions = process.argv[3] ?? '{}'
      const options = JSON.parse(serializedOptions)

      maybeExecutorPromise = initExecutor(serverAssemblies, options)
    }
    const executor = await maybeExecutorPromise

    await executor()
  } catch (error) {
    log.error('Local executor fatal error: ', error)
    throw error
  }
}

main()
