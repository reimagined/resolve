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
        unit: 'Count',
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

test('stores error correctly on multiple error method calls', () => {
  const adapter = createAdapter()

  class TestError extends Error {
    name = 'TestError'

    constructor() {
      super('test-message')
    }
  }

  adapter.error(new TestError())
  adapter.error(new TestError())

  expect(adapter.getMetrics()).toEqual({
    metrics: [
      {
        metricName: 'Errors',
        timestamp: null,
        unit: 'Count',
        dimensions: [
          { name: 'ErrorName', value: 'TestError' },
          { name: 'ErrorMessage', value: 'test-message' },
        ],
        values: [1],
        counts: [2],
      },
    ],
  })
})

test('return empty metrics after clear method call', () => {
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
        unit: 'Count',
        dimensions: [
          { name: 'ErrorName', value: 'TestError' },
          { name: 'ErrorMessage', value: 'test-message' },
        ],
        values: [1],
        counts: [1],
      },
    ],
  })

  adapter.clearMetrics()

  expect(adapter.getMetrics()).toEqual({
    metrics: []
  })
})

test('count of rate metrics per second', () => {
  const adapter = createAdapter()
  const metricName = 'test-metric'
  const count = 100

  adapter.rate(metricName, count)

  expect(adapter.getMetrics()).toEqual({
    metrics: [
      {
        metricName: 'test-metric',
        timestamp: null,
        unit: 'Count/Second',
        dimensions: null,
        values: [100],
        counts: [1],
      },
    ],
  })
})

test('count of rate metrics per five second', () => {
  const adapter = createAdapter()
  const metricName = 'test-metric'
  const count = 100

  adapter.rate(metricName, count, 5)

  expect(adapter.getMetrics()).toEqual({
    metrics: [
      {
        metricName: 'test-metric',
        timestamp: null,
        unit: 'Count/Second',
        dimensions: null,
        values: [20],
        counts: [1],
      },
    ],
  })
})

test('count of rate metrics correctly on multiple rate method calls', () => {
  const adapter = createAdapter()
  const metricName = 'test-metric'
  const count = 100

  adapter.rate(metricName, count, 5)
  adapter.rate('test-metric1', count)
  adapter.rate('test-metric2', count)

  // console.log('qweqweq', adapter.getMetrics())

  expect(adapter.getMetrics()).toEqual({
    metrics: [
      {
        metricName: 'test-metric',
        timestamp: null,
        unit: 'Count/Second',
        dimensions: null,
        values: [20],
        counts: [1],
      },
      {
        metricName: 'test-metric1',
        timestamp: null,
        unit: 'Count/Second',
        dimensions: null,
        values: [100],
        counts: [1],
      },
      {
        metricName: 'test-metric2',
        timestamp: null,
        unit: 'Count/Second',
        dimensions: null,
        values: [100],
        counts: [1],
      },
    ],
  })
})

test.skip('duplicate values', () => {
  const adapter = createAdapter()
  const metricName = 'test-metric'
  const count = 100

  adapter.rate(metricName, count, 5)
  adapter.rate('test-metric1', count)
  adapter.rate('test-metric1', count)

  expect(adapter.getMetrics()).toEqual({
    metrics: [
      {
        metricName: 'test-metric',
        timestamp: null,
        unit: 'Count/Second',
        dimensions: [{ name: 'metric-name', value: 'test-metric' }],
        values: [20],
        counts: [1],
      },
      {
        metricName: 'test-metric1',
        timestamp: null,
        unit: 'Count/Second',
        dimensions: [{ name: 'metric-name', value: 'test-metric1' }],
        values: [100],
        counts: [2],
      },
    ],
  })
})

test('single duration call', () => {
  const adapter = createAdapter()
  const label = 'test-label'

  adapter.duration(label, 100)

  expect(adapter.getMetrics()).toEqual({
    metrics: [
      {
        metricName: 'Duration',
        timestamp: null,
        unit: 'Milliseconds',
        dimensions: [{ name: 'Label', value: label }],
        values: [100],
        counts: [1],
      }
    ]
  })
})

test('multiple duration calls', () => {
  const adapter = createAdapter()
  const label = 'test-label'

  adapter.duration(label, 100)
  expect(adapter.getMetrics()).toEqual({
    metrics: [
      {
        metricName: 'Duration',
        timestamp: null,
        unit: 'Milliseconds',
        dimensions: [
          { name: 'Label', value: 'test-label' }        
        ],
        values: [100],
        counts: [1],
      }
    ]
  })

  adapter.duration(`${label}-1`, 200)
  expect(adapter.getMetrics()).toEqual({
    metrics: [
      {
        metricName: 'Duration',
        timestamp: null,
        unit: 'Milliseconds',
        dimensions: [
          { name: 'Label', value: 'test-label' },
          { name: 'Label', value: 'test-label-1' }          
        ],
        values: [100, 200],
        counts: [1, 1],
      }
    ]
  })
})

test('multiple duration calls with same duration value', () => {
  const adapter = createAdapter()
  const label = 'test-label'
  adapter.duration(label, 100)
  adapter.duration(`${label}-1`, 100)

  expect(adapter.getMetrics()).toEqual({
    metrics: [
      {
        metricName: 'Duration',
        timestamp: null,
        unit: 'Milliseconds',
        dimensions: [
          { name: 'Label', value: label },
          { name: 'Label', value: `${label}-1` },
        ],
        values: [100],
        counts: [2],
      }
    ]
  })
})

test('single execution call', () => {
  const adapter = createAdapter()

  adapter.execution()

  expect(adapter.getMetrics()).toEqual({
    metrics: [
      {
        metricName: 'Execution',
        timestamp: null,
        unit: 'Count',
        dimensions: [],
        values: [1],
        counts: [1],
      }
    ]
  })
})

test('call group method with one argument', () => {
  const adapter = createAdapter()
  const innerAdapter = adapter.group({
    'test-group': 'test-group-name',
  })
  innerAdapter.execution()  

  expect(adapter.getMetrics()).toEqual({
    metrics: [{
      metricName: 'Execution',
      timestamp: null,
      unit: 'Count',
      dimensions: [
        { Name: 'test-group', Value: 'test-group-name'},
      ],
      values: [1],
      counts: [1],
    }]
  })
})

test('call group method with several arguments', () => {
  const adapter = createAdapter()
  const innerAdapter = adapter.group({
    'test-group': 'test-group-name',
    'test-group1': 'test-group-name1',
  })
  innerAdapter.execution()

  expect(adapter.getMetrics()).toEqual({
    metrics: [{
      metricName: 'Execution',
      timestamp: null,
      unit: 'Count',
      dimensions: [
        { Name: 'test-group', Value: 'test-group-name'},
        { Name: 'test-group1', Value: 'test-group-name1'},
      ],
      values: [1],
      counts: [1],
    }]
  })
})

test('multiple group method calls', () => {
  const adapter = createAdapter()
  const innerAdapter = adapter.group({
    'test-group': 'test-group-name',
  })
  innerAdapter.execution()

  expect(adapter.getMetrics()).toEqual({
    metrics: [{
      metricName: 'Execution',
      timestamp: null,
      unit: 'Count',
      dimensions: [
        { Name: 'test-group', Value: 'test-group-name'},
      ],
      values: [1],
      counts: [1],
    }]
  })

  const secondInnerAdapter = innerAdapter.group({
    'Part-test': 'Part-test-name',
    'Part-test1': 'Part-test-name1'
  })

  secondInnerAdapter.execution()

  expect(adapter.getMetrics()).toEqual({
    metrics: [{
        metricName: 'Execution',
        timestamp: null,
        unit: 'Count',
        dimensions: [
          { Name: 'test-group', Value: 'test-group-name'},
        ],
        values: [1],
        counts: [1],
      },
      {
       metricName: 'Execution',
        timestamp: null,
        unit: 'Count',
        dimensions: [
          { Name: 'test-group', Value: 'test-group-name'},
          { Name: 'Part-test', Value: 'Part-test-name'},
          { Name: 'Part-test1', Value: 'Part-test-name1'},
        ],
        values: [1],
        counts: [1],
    }]
  })
})

test('should be return empty dimensions list on call execution method at base adapter', () => {
  const adapter = createAdapter()
  const innerAdapter = adapter.group({
    'test-group':'test-group-name'
  })

  adapter.execution()

  expect(adapter.getMetrics()).toEqual({
    metrics: [{
      metricName: 'Execution',
      timestamp: null,
      unit: 'Count',
      dimensions: [],
      values: [1],
      counts: [1],
    }]
  })
})
