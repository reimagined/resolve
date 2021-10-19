import { HttpError } from '@resolve-js/client'

const makeScenariosQuery = (name, ids) => {
  const query = { name }
  if (ids) {
    const byIds = { $or: ids.map((id) => ({ id })) }
    return {
      $and: [query, byIds],
    }
  }
  return query
}

const resolvers = {
  retryOnErrorScenario: async (store, { scenarioId }) => {
    const entry = await store.findOne('ExecutedScenarios', {
      id: scenarioId,
      name: 'retry-on-error-read-model',
    })

    if (entry == null || entry.state == null || entry.state.blocked) {
      throw HttpError(500, 'Test scenario test error to ignore on client')
    }
    return entry.state
  },
  arrayWithinQueryStringScenario: async (store, { scenarioIds }) => {
    const entries = await store.find(
      'ExecutedScenarios',
      makeScenariosQuery('array-within-query-string', scenarioIds)
    )
    return {
      requested: scenarioIds,
      result: entries ? entries.map((entry) => entry.id) : [],
    }
  },
}

export default resolvers
