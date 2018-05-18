import { CronJob } from 'cron'

import executeReadModelQuery from './execute_read_model_query'
import executeViewModelQuery from './execute_view_model_query'
import eventStore from './event_store'
import executeCommand from './command_executor'

const sagas = require($resolve.sagas)

const createSaga = (saga = {}, context) => {
  const { eventHandlers = {}, cronHandlers = {} } = saga

  Object.keys(eventHandlers).map(eventName =>
    context.resolve.subscribeByEventType([eventName], event =>
      eventHandlers[eventName](event, context)
    )
  )

  Object.keys(cronHandlers).map(
    cronTime =>
      new CronJob({
        cronTime,
        onTick: a => cronHandlers[cronTime](a, context),
        start: true
      })
  )
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
