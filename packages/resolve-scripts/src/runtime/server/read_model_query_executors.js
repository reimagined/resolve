import { createReadModel, createFacade } from 'resolve-query'
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

  const facade = createFacade({
    model: createReadModel({
      projection: readModel.projection,
      adapter: readModel.adapter,
      eventStore
    }),
    resolvers: readModel.resolvers
  })

  readModelQueryExecutors[readModel.name] = facade.executeQuery

  readModelQueryExecutors[readModel.name].makeSubscriber =
    facade.makeReactiveReader

  readModelQueryExecutors[readModel.name].resolverNames = Object.keys(
    readModel.resolvers
  )

  readModelQueryExecutors[readModel.name].mode = 'read'
})

export default readModelQueryExecutors
