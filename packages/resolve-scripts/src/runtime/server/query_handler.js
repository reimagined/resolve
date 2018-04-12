import viewModelHandler from './view_model_handler'
import readModelNonReactiveHandler from './read_model_non_reactive_handler'
import readModelReactiveHandler from './read_model_reactive_handler'

const queryHandler = (req, res) => {
  if (
    (req.method === 'POST' && req.body.isReactive) ||
    req.method === 'DELETE'
  ) {
    return readModelReactiveHandler(req, res)
  }

  if (req.method === 'POST' && !req.body.isReactive) {
    return readModelNonReactiveHandler(req, res)
  }

  if (req.method === 'GET') {
    return viewModelHandler(req, res)
  }

  return res.status(405).end()
}

export default queryHandler
