const projection = {
  Init: async (store) => {
    await store.defineTable('SagaSchedulerTestRecords', {
      indexes: { id: 'string' },
      fields: [],
    })
  },
  SagaSchedulerSucceeded: async (store, event) => {
    const {
      payload: { testId },
    } = event

    await store.insert('SagaSchedulerTestRecords', {
      id: testId,
    })
  },
}

export default projection
