import { getLog } from './get-log'

const log = getLog(`backgroundJob`)

export function backgroundJob<TJob extends (...args: any[]) => any>(
  job: TJob
): (...args: Parameters<TJob>) => Promise<void> {
  log.debug(`creating job executor for [${job.name}]`)
  return async (...args: Parameters<TJob>) => {
    const worker = async () => {
      try {
        await job(...args)
      } catch (error) {
        const message =
          error instanceof Error ? `${error.message}\n${error.stack}` : error
        log.warn(
          `Background job function ${job.name} failed with error: ${message}`
        )
      }
    }

    setImmediate(worker)
  }
}
