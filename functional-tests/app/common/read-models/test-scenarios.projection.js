import {
  TEST_SCENARIO_EXECUTED,
  TEST_SCENARIO_RETRY_ON_ERROR_UNBLOCKED,
} from '../event-types'

const projection = {
  Init: async (store) => {
    await store.defineTable('ExecutedScenarios', {
      indexes: { id: 'string', name: 'string' },
      fields: ['state'],
    })
  },
  [TEST_SCENARIO_EXECUTED]: async (store, event) => {
    const {
      aggregateId,
      payload: { scenarioName, state },
    } = event

    await store.insert('ExecutedScenarios', {
      id: aggregateId,
      name: scenarioName,
      state,
    })
  },
  [TEST_SCENARIO_RETRY_ON_ERROR_UNBLOCKED]: async (
    store,
    { aggregateId, payload: { scenarioName } }
  ) => {
    await store.update(
      'ExecutedScenarios',
      { id: aggregateId, name: scenarioName },
      {
        $set: {
          state: {
            blocked: false,
          },
        },
      }
    )
  },
}

export default projection
