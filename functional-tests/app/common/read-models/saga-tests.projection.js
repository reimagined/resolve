export default {
  Init: async (store) => {
    await store.defineTable('SagaTestRecords', {
      indexes: { id: 'string' },
      fields: ['count'],
    })
  },
  SagaTestSucceeded: async (store, event) => {
    const {
      payload: { testId },
    } = event

    await store.update(
      'SagaTestRecords',
      {
        id: testId,
      },
      {
        $inc: { count: 1 },
      },
      { upsert: true }
    )
  },
}
