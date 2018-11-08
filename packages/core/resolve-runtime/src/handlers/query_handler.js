import { constants } from 'resolve-query'

import getRootBasedUrl from '../utils/get_root_based_url'
import readModelHandler from './read_model_handler'
import viewModelHandler from './view_model_handler'

import extractRequestBody from '../utils/extract_request_body'
import message from '../message'

const { modelTypes } = constants

const queryHandler = async (req, res) => {
  try {
    if (req.method !== 'GET' && req.method !== 'POST') {
      throw new Error('Invalid HTTP method for query invocation')
    }

    const baseQueryUrl = getRootBasedUrl(req.resolve.rootPath, '/api/query/')
    const paramsPath = req.path.substring(baseQueryUrl.length)
    const [modelName, modelOptions] = paramsPath.split('/')

    if (modelName == null || modelOptions == null) {
      throw new Error('Invalid "modelName" and/or "modelOptions" parameters')
    }

    req.params = { modelName, modelOptions }
    req.arguments = extractRequestBody(req)

    const executeQuery = req.resolve.executeQuery
    const modelType = executeQuery.getModelType(req.params.modelName)

    switch (modelType) {
      case modelTypes.viewModel: {
        return await viewModelHandler(req, res)
      }
      case modelTypes.readModel: {
        return await readModelHandler(req, res)
      }
      default: {
        await res.status(422)
        await res.end(message.incorrectQuery)
      }
    }
  } catch (error) {
    await res.status(405)
    await res.end(error.message)
  }
}

export default queryHandler
