import { start } from './step-function'
import getLog from './get-log'

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
  getLog('createAdapter').debug(`building new resolve cloud scheduler adapter`)
  return {
    async addEntries(data) {
      const log = getLog('addEntries')

      log.debug(`adding new scheduled entries`)
      log.verbose(`data: ${JSON.stringify(data)}`)

      const entries = [].concat(data)
      try {
        log.debug(`starting step function executions`)
        await Promise.all(
          entries.map(entry =>
            validateEntry(entry)
              ? start(entry)
              : errorHandler(Error(`invalid entry ${JSON.stringify(entry)}`))
          )
        )
        log.debug(`entries were successfully added`)
      } catch (e) {
        log.error(e.message)
        await errorHandler(e)
      }
    },
    async clearEntries() {
      const log = getLog('clearEntries')

      log.debug(`step functions cannot be recreated, skipping clearing`)
    },
    async executeEntries(data) {
      const log = getLog('executingEntries')

      log.debug(`executing scheduled entries`)
      log.verbose(`data: ${JSON.stringify(data)}`)

      const entries = [].concat(data)
      try {
        log.debug(`executing tasks`)
        await Promise.all(
          entries.map(({ taskId, date, command }) =>
            execute(taskId, date, command)
          )
        )
        log.debug(`tasks were successfully executed`)
      } catch (e) {
        log.error(e.message)
        await errorHandler(e)
      }
    }
  }
}

export default createAdapter
