import { TEST_SCENARIO_EXECUTED } from '../event-types'

export default {
  Init: async (store) => {
    await store.defineTable('ExecutedScenarios', {
      indexes: { id: 'string', name: 'string' },
      fields: ['data', 'state'],
    })
  },
  [TEST_SCENARIO_EXECUTED]: async (store, event) => {
    const {
      aggregateId,
      payload: { scenarioName, ...data },
    } = event

    await store.insert('ExecutedScenarios', {
      id: aggregateId,
      name: scenarioName,
      data,
      state: {},
    })
  },
}
