export default {
  requestSagaSchedulerTest: (_, { payload }) => ({
    type: 'SagaSchedulerRequested',
    payload,
  }),
  succeedSagaSchedulerTest: (_, { payload }) => ({
    type: 'SagaSchedulerSucceeded',
    payload,
  }),
}
