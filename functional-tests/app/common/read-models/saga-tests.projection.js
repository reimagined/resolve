const projection = {
  Init: async (store) => {
    await store.defineTable('SagaTestRecords', {
      indexes: { id: 'string' },
      fields: ['count', 'counterId'],
    })
  },
  SagaTestSucceeded: async (store, event) => {
    const {
      payload: { testId, counterId },
    } = event

    try {
      await store.insert('SagaTestRecords', {
        id: testId,
        counterId,
        count: 1,
      })
    } catch (e) {
      await store.update(
        'SagaTestRecords',
        {
          id: testId,
        },
        {
          $inc: { count: 1 },
        }
      )
    }
  },
}

export default projection
