import viewModelHandler from './view_model_handler'
import readModelHandler from './read_model_handler'

const queryHandler = (req, res) => {
  switch (req.method) {
    case 'POST': {
      return readModelHandler(req, res)
    }
    case 'GET': {
      return viewModelHandler(req, res)
    }
    default: {
      return res.status(405).end()
    }
  }
}

export default queryHandler
