import executeReadModelQuery from './execute_read_model_query'
import executeViewModelQuery from './execute_view_model_query'
import eventStore from './event_store'
import executeCommand from './command_executor'

import { sagas } from './resources'

const sagaRunner = () => {
  sagas.forEach(saga =>
    saga({
      resolve: {
        subscribeByEventType: eventStore.subscribeByEventType,
        subscribeByAggregateId: eventStore.subscribeByAggregateId,
        executeReadModelQuery,
        executeViewModelQuery,
        executeCommand
      }
    })
  )
}

export default sagaRunner
