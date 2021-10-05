import createAdapter from '../src'

test('returns empty metrics on created', () => {
  const adapter = createAdapter()

  expect(adapter.getMetrics()).toEqual({
    metrics: [],
  })
})

test('stores error with correct dimensions', () => {
  const adapter = createAdapter()

  class TestError extends Error {
    name = 'TestError'

    constructor() {
      super('test-message')
    }
  }

  adapter.error(new TestError())

  expect(adapter.getMetrics()).toEqual({
    metrics: [
      {
        metricName: 'Errors',
        timestamp: null,
        unit: 'count',
        dimensions: [
          { name: 'ErrorName', value: 'TestError' },
          { name: 'ErrorMessage', value: 'test-message' },
        ],
        values: [1],
        counts: [1],
      },
    ],
  })
})
