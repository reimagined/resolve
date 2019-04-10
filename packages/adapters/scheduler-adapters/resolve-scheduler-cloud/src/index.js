import { start, stopAll } from './step-function'

const isEmpty = obj =>
  Object.keys(obj).reduce(
    (empty, key) => empty && !obj.hasOwnProperty(key),
    true
  )

const validateEntry = ({ date, taskId, command }) =>
  date != null &&
  date.constructor === Number &&
  taskId != null &&
  taskId.constructor === String &&
  command != null &&
  command.constructor === Object &&
  !isEmpty(command)

const createAdapter = ({ execute, errorHandler = async () => {} }) => {
  return {
    async addEntries(data) {
      const entries = [].concat(data)
      try {
        await Promise.all(
          entries.map(entry =>
            validateEntry(entry)
              ? start(entry)
              : errorHandler(Error(`invalid entry ${JSON.stringify(entry)}`))
          )
        )
      } catch (e) {
        await errorHandler(e)
      }
    },
    async clearEntries() {
      try {
        await stopAll()
      } catch (e) {
        await errorHandler(e)
      }
    },
    async executeEntries(data) {
      const entries = [].concat(data)
      try {
        await Promise.all(
          entries.map(({ taskId, date, command }) =>
            execute(taskId, date, command)
          )
        )
      } catch (e) {
        await errorHandler(e)
      }
    }
  }
}

export default createAdapter
