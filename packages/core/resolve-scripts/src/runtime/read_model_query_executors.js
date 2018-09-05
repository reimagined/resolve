import { createReadModel } from 'resolve-query'
import createDefaultAdapter from 'resolve-readmodel-memory'

import eventStore from './event_store'
import raiseError from './utils/raise_error'

import { readModels } from './assemblies'

const message = require('../../configs/message.json')

const readModelQueryExecutors = {}

readModels.forEach(readModel => {
  if (!readModel.name && readModels.length === 1) {
    readModel.name = 'default'
  } else if (!readModel.name) {
    raiseError(message.readModelMandatoryName, readModel)
  } else if (readModelQueryExecutors[readModel.name]) {
    raiseError(message.duplicateName, readModel)
  }

  const facade = createReadModel({
    projection: readModel.projection,
    resolvers: readModel.resolvers,
    adapter: readModel.hasOwnProperty('adapter')
      ? readModel.adapter.module(readModel.adapter.options)
      : createDefaultAdapter(),
    eventStore
  })

  readModelQueryExecutors[readModel.name] = {
    read: facade.read,
    resolverNames: Object.keys(readModel.resolvers),
    getLastError: facade.getLastError
  }
})

export default readModelQueryExecutors
