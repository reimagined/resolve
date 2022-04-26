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

    const sagaTest = await store.findOne('SagaTestRecords', { id: testId })

    if (sagaTest == null) {
      await store.insert('SagaTestRecords', {
        id: testId,
        counterId,
        count: 1,
      })
    } else {
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
