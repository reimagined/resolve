import readModelQueryExecutors from './read_model_query_executors'
import viewModelQueryExecutors from './view_model_query_executors'
import eventStore from './event_store'
import executeCommand from './command_executor'

const sagas = require($resolve.sagas)

const sagaRunner = () => {
  sagas.forEach(saga =>
    saga({
      subscribeByEventType: eventStore.subscribeByEventType,
      subscribeByAggregateId: eventStore.subscribeByAggregateId,
      readModelQueryExecutors,
      viewModelQueryExecutors,
      executeCommand
    })
  )
}

export default sagaRunner
