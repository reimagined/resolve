import 'source-map-support/register'
import fs from 'fs'

import { initLambdaWorker } from './lambda-worker'
import { getServerAssemblies } from './utils'

import { getLog } from '@resolve-js/runtime-base'

const log = getLog('aws-serverless-entry')

let maybeLambdaWorkerPromise: Promise<Function> | null = null
const main = async (...args: any[]) => {
  try {
    if (maybeLambdaWorkerPromise == null) {
      const handlerPath = `${process.env.LAMBDA_TASK_ROOT}/cloud-entry.js`
      if (handlerPath == null || !fs.existsSync(handlerPath)) {
        throw new Error(`Entry "${handlerPath}" is not provided`)
      }
      process.env.__RUNTIME_ENTRY_PATH = handlerPath

      const serverAssemblies = getServerAssemblies(handlerPath)

      // console.log(serverAssemblies)

      maybeLambdaWorkerPromise = initLambdaWorker(serverAssemblies)
    }
    const worker = await maybeLambdaWorkerPromise

    return await worker(...args)
  } catch (error) {
    log.error('Lambda handler fatal error: ', error)
    throw error
  }
}

export const resetLambdaWorker = () => {
  maybeLambdaWorkerPromise = null
}

export default main
