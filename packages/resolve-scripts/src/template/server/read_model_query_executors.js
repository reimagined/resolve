import { createReadModel, createFacade } from 'resolve-query'
import eventStore from './event_store'
import raiseError from './utils/raise_error'
import message from './constants/message'

const readModels = require($resolve.readModels)

const readModelQueryExecutors = {}

readModels.forEach(readModel => {
  if (!readModel.name) {
    raiseError(message.readModelMandatoryName, readModel)
  } else if (readModelQueryExecutors[readModel.name]) {
    raiseError(message.dublicateName, readModel)
  }

  if (!readModel.gqlSchema || !readModel.gqlResolvers) {
    raiseError(message.readModelQuerySideMandatory, readModel)
  }

  readModelQueryExecutors[readModel.name] = createFacade({
    model: createReadModel({
      projection: readModel.projection,
      adapter: readModel.adapter,
      eventStore
    }),
    gqlSchema: readModel.gqlSchema,
    gqlResolvers: readModel.gqlResolvers
  }).executeQueryGraphql
})

export default readModelQueryExecutors
