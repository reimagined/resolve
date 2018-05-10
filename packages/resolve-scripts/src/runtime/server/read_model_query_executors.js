import { createReadModel } from 'resolve-query'
import eventStore from './event_store'
import raiseError from './utils/raise_error'

const message = require('../../../configs/message.json')

const readModels = require($resolve.readModels)

const readModelQueryExecutors = {}

readModels.forEach(readModel => {
  if (!readModel.name && readModels.length === 1) {
    readModel.name = 'default'
  } else if (!readModel.name) {
    raiseError(message.readModelMandatoryName, readModel)
  } else if (readModelQueryExecutors[readModel.name]) {
    raiseError(message.dublicateName, readModel)
  }

  const facade = createReadModel({
    projection: readModel.projection,
    adapter: readModel.adapter,
    resolvers: readModel.resolvers,
    eventStore
  })

  readModelQueryExecutors[readModel.name] = {
    read: facade.read,
    makeSubscriber: facade.makeReactiveReader,
    resolverNames: Object.keys(readModel.resolvers),
    getLastError: facade.getLastError
  }
})

export default readModelQueryExecutors
