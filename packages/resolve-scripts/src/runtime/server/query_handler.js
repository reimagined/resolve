import viewModelHandler from './view_model_handler'
import readModelNonReactiveHandler from './read_model_non_reactive_handler'
import readModelReactiveHandlers from './read_model_reactive_handler'

const {
  readModelSubscribeHandler,
  readModelUnsubscribeHandler
} = readModelReactiveHandlers

const queryHandler = (req, res) => {
  //stopReadModelSubscription
  if (req.method === 'POST') {
    if (req.body.viewModelName && req.body.aggregateIds) {
      return viewModelHandler(req, res)
    }

    if (
      req.body.readModelName &&
      req.body.resolverName &&
      req.body.queryId &&
      !req.body.isReactive
    ) {
      return readModelNonReactiveHandler(req, res)
    }

    if (
      req.body.readModelName &&
      req.body.resolverName &&
      req.body.queryId &&
      req.body.isReactive
    ) {
      return readModelSubscribeHandler(req, res)
    }

    if (req.body.stopReadModelSubscription && req.body.queryId) {
      return readModelUnsubscribeHandler(req, res)
    }
  }

  return res.status(405).end()
}

export default queryHandler
