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
    const scenario = await store.findOne('ExecutedScenarios', {
      id: aggregateId,
      name: scenarioName,
    })

    if (scenario == null) {
      // disable-eslint-next-line no-console
      console.warn(
        `Test scenario ${scenarioName} is not found for "${aggregateId}" aggregate id. Update will be skipped`
      )
    }

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
