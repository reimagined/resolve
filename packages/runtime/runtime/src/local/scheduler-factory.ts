import type { SchedulerEntry } from '../common/types'
import {
  createRuntime,
  Runtime,
  RuntimeFactoryParameters,
} from '../common/create-runtime'

const errorHandler = async (error: any) => {
  throw error
}

export const schedulerFactory = async (
  runtimeParams: RuntimeFactoryParameters,
  schedulerName: string
) => {
  const timeouts = new Set<NodeJS.Timeout>()
  let flowPromise = Promise.resolve()

  return {
    async addEntries(array: SchedulerEntry[]) {
      for (const entry of array) {
        // eslint-disable-next-line no-loop-func
        const timeout = setTimeout(() => {
          flowPromise = flowPromise
            .then(async () => {
              timeouts.delete(timeout)
              let runtime: Runtime | null = null
              try {
                runtime = await createRuntime(runtimeParams)
                await runtime.executeSchedulerCommand({
                  aggregateName: schedulerName,
                  aggregateId: entry.taskId,
                  type: 'execute',
                  payload: { date: entry.date, command: entry.command },
                })
              } finally {
                if (runtime != null) {
                  await runtime.dispose()
                }
              }
            })
            .catch(async (error) => {
              if (typeof errorHandler === 'function') {
                await errorHandler(error)
              } else {
                throw error
              }
            })
        }, new Date(entry.date).getTime() - Date.now())

        timeouts.add(timeout)
      }
    },
    async clearEntries() {
      for (const timeout of timeouts.values()) {
        clearTimeout(timeout)
      }

      timeouts.clear()
    },
  }
}
