const aggregate = {
  requestSagaSchedulerTest: (_, { payload }) => ({
    type: 'SagaSchedulerRequested',
    payload,
  }),
  succeedSagaSchedulerTest: (_, { payload }) => ({
    type: 'SagaSchedulerSucceeded',
    payload,
  }),
}

export default aggregate
