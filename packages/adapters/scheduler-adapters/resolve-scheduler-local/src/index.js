const createAdapter = ({ execute, errorHandler = async () => {} }) => {
  const timeouts = new Set()
  let flowPromise = Promise.resolve()
  let isCrashed = false

  return {
    async addEntries(array) {
      for (const entry of array) {
        // eslint-disable-next-line no-loop-func
        const timeout = setTimeout(() => {
          flowPromise = flowPromise
            .then(async () => {
              await execute(entry.taskId, entry.date, entry.command)
              timeouts.delete(timeout)
            })
            .catch(async error => {
              if (!isCrashed) {
                await errorHandler(error)
                isCrashed = true
              }
              throw error
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
    }
  }
}

export default createAdapter
