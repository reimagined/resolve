import initResolve from '../common/init-resolve'
import disposeResolve from '../common/dispose-resolve'

const errorHandler = async (error) => {
  throw error
}

const initScheduler = (resolve) => {
  const timeouts = new Set()
  let flowPromise = Promise.resolve()

  resolve.scheduler = {
    async addEntries(array) {
      for (const entry of array) {
        // eslint-disable-next-line no-loop-func
        const timeout = setTimeout(() => {
          flowPromise = flowPromise
            .then(async () => {
              timeouts.delete(timeout)
              const currentResolve = Object.create(resolve)
              try {
                await initResolve(currentResolve)
                await currentResolve.executeSchedulerCommand({
                  aggregateName: resolve.domainInterop.sagaDomain.schedulerName,
                  aggregateId: entry.taskId,
                  type: 'execute',
                  payload: { date: entry.date, command: entry.command },
                })
              } finally {
                await disposeResolve(currentResolve)
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

export default initScheduler
