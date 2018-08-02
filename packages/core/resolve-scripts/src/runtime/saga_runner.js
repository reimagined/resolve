import { CronJob } from 'cron'

import executeReadModelQuery from './execute_read_model_query'
import executeViewModelQuery from './execute_view_model_query'
import eventStore from './event_store'
import executeCommand from './command_executor'

import { sagas } from './assemblies'

const CRON_REBOOT = '@reboot'
const CRON_VARS = {
  '@yearly': '0 0 0 1 1 *',
  '@annually': '0 0 0 1 1 *',
  '@weekly': '0 0 0 * * 0',
  '@daily': '0 0 0 * * *',
  '@hourly': '0 0 * * * *'
}

const createSaga = (saga = {}, context) => {
  const { eventHandlers = {}, cronHandlers = {} } = saga

  Object.keys(eventHandlers).map(eventName =>
    context.resolve.subscribeByEventType([eventName], event =>
      eventHandlers[eventName](event, context)
    )
  )

  Object.keys(cronHandlers).map(cronTime => {
    let cronArg = CRON_VARS[cronTime] ? CRON_VARS[cronTime] : cronTime

    if (cronTime === CRON_REBOOT) {
      return cronHandlers[cronTime](null, context)
    }

    return new CronJob({
      cronArg,
      onTick: a => cronHandlers[cronTime](a, context),
      start: true
    })
  })
}

const sagaRunner = () => {
  sagas.forEach(saga => {
    const context = {
      resolve: {
        subscribeByEventType: eventStore.subscribeByEventType,
        subscribeByAggregateId: eventStore.subscribeByAggregateId,
        executeReadModelQuery,
        executeViewModelQuery,
        executeCommand
      }
    }

    createSaga(saga, context)
  })
}

export default sagaRunner
