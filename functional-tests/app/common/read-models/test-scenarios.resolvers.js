import { HttpError } from 'resolve-client'

export default {
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
}
