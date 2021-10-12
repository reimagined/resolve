import { mocked } from 'ts-jest/utils'

import createMonitoring from '../src'

let originalNow: typeof Date.now
let dateSpy: typeof Date.now | null = null

beforeEach(() => {
  originalNow = Date.now
  Date.now = jest.fn().mockReturnValue(1234)
})

afterEach(() => {
  Date.now = originalNow

  if (dateSpy != null) {
    mocked(dateSpy).mockRestore()
    dateSpy = null
  }
})

describe('common', () => {
  test('gets timestamp from function if it is passed into adapter', async () => {
    const monitoring = createMonitoring({
      getTimestamp: () => 123456,
    }).group({ 'test-group-name': 'test-group' })

    monitoring.execution()

    const data = monitoring.getMetrics()

    expect(data.metrics).toEqual([
      {
        metricName: 'Executions',
        unit: 'Count',
        timestamp: 123456,
        dimensions: [{ name: 'test-group-name', value: 'test-group' }],
        values: [1],
        counts: [1],
      },
    ])
  })

  test('sets timestamp as null if getTimestamp is NOT passed into adapter', async () => {
    const monitoring = createMonitoring().group({
      'test-group-name': 'test-group',
    })

    monitoring.execution()

    const data = monitoring.getMetrics()

    expect(data.metrics).toEqual([
      {
        metricName: 'Executions',
        unit: 'Count',
        timestamp: null,
        dimensions: [{ name: 'test-group-name', value: 'test-group' }],
        values: [1],
        counts: [1],
      },
    ])
  })

  test('clears metrics correctly', async () => {
    const monitoring = createMonitoring()

    monitoring.execution()

    expect(monitoring.getMetrics().metrics).toHaveLength(1)

    monitoring.clearMetrics()

    expect(monitoring.getMetrics().metrics).toHaveLength(0)
  })

  test('combines values in one metric if all params are the same', async () => {
    const monitoring = createMonitoring()

    monitoring.duration('test-label', 1000)
    monitoring.duration('test-label', 1500)

    const data = monitoring.getMetrics()

    expect(data.metrics).toEqual([
      {
        metricName: 'Duration',
        unit: 'Milliseconds',
        timestamp: null,
        dimensions: [{ name: 'Label', value: 'test-label' }],
        values: [1000, 1500],
        counts: [1, 1],
      },
    ])
  })

  test('combines values in one metric if all params are the same and value already in value list', async () => {
    const monitoring = createMonitoring()

    monitoring.duration('test-label', 1300)
    monitoring.duration('test-label', 1300)

    const data = monitoring.getMetrics()

    expect(data.metrics).toEqual([
      {
        metricName: 'Duration',
        unit: 'Milliseconds',
        timestamp: null,
        dimensions: [{ name: 'Label', value: 'test-label' }],
        values: [1300],
        counts: [2],
      },
    ])
  })

  test('combines values in one metric if all params are the same and value already in value list', async () => {
    const monitoring = createMonitoring()

    monitoring.duration('test-label', 1300)
    monitoring.duration('test-label', 800)
    monitoring.duration('test-label', 1300)

    const data = monitoring.getMetrics()

    expect(data.metrics).toEqual([
      {
        metricName: 'Duration',
        unit: 'Milliseconds',
        timestamp: null,
        dimensions: [{ name: 'Label', value: 'test-label' }],
        values: [1300, 800],
        counts: [2, 1],
      },
    ])
  })
})

describe('error', () => {
  test('contains default dimensions', async () => {
    const monitoring = createMonitoring()

    class TestError extends Error {
      name = 'test-error'
    }

    monitoring.error(new TestError('test-message'))

    const data = monitoring.getMetrics()

    expect(data.metrics).toEqual([
      {
        metricName: 'Errors',
        unit: 'Count',
        timestamp: null,
        dimensions: [
          { name: 'ErrorName', value: 'test-error' },
          { name: 'ErrorMessage', value: 'test-message' },
        ],
        values: [1],
        counts: [1],
      },
    ])
  })

  test('contains default and group dimensions', async () => {
    const monitoring = createMonitoring()

    const groupMonitoring = monitoring.group({
      'test-group-name': 'test-group',
    })

    class TestError extends Error {
      name = 'test-error'
    }

    groupMonitoring.error(new TestError('test-message'))

    const data = monitoring.getMetrics()

    expect(data.metrics).toEqual([
      {
        metricName: 'Errors',
        unit: 'Count',
        timestamp: null,
        dimensions: [
          { name: 'test-group-name', value: 'test-group' },
          { name: 'ErrorName', value: 'test-error' },
          { name: 'ErrorMessage', value: 'test-message' },
        ],
        values: [1],
        counts: [1],
      },
    ])
  })

  test('contains default and group dimensions for multiple group calls', async () => {
    const monitoring = createMonitoring()

    const groupMonitoring = monitoring
      .group({
        'first-group-name': 'first-group',
      })
      .group({
        'second-group-name': 'second-group',
      })

    class TestError extends Error {
      name = 'test-error'
    }

    groupMonitoring.error(new TestError('test-message'))

    const data = monitoring.getMetrics()

    expect(data.metrics).toEqual([
      {
        metricName: 'Errors',
        unit: 'Count',
        timestamp: null,
        dimensions: [
          { name: 'first-group-name', value: 'first-group' },
          { name: 'second-group-name', value: 'second-group' },
          { name: 'ErrorName', value: 'test-error' },
          { name: 'ErrorMessage', value: 'test-message' },
        ],
        values: [1],
        counts: [1],
      },
    ])
  })

  test('contains correct metrics if different errors are passed', async () => {
    const monitoring = createMonitoring()

    class TestError extends Error {
      name = 'test-error'
    }

    monitoring.error(new TestError('test-message-1'))
    monitoring.error(new TestError('test-message-2'))

    await monitoring.publish()

    const data = monitoring.getMetrics()

    expect(data.metrics).toEqual([
      {
        metricName: 'Errors',
        unit: 'Count',
        timestamp: null,
        dimensions: [
          { name: 'ErrorName', value: 'test-error' },
          { name: 'ErrorMessage', value: 'test-message-1' },
        ],
        values: [1],
        counts: [1],
      },
      {
        metricName: 'Errors',
        unit: 'Count',
        timestamp: null,
        dimensions: [
          { name: 'ErrorName', value: 'test-error' },
          { name: 'ErrorMessage', value: 'test-message-2' },
        ],
        values: [1],
        counts: [1],
      },
    ])
  })

  test('contains correct metrics if same error is passed multiple times', async () => {
    const monitoring = createMonitoring()

    class TestError extends Error {
      name = 'test-error'
    }

    monitoring.error(new TestError('test-message'))
    monitoring.error(new TestError('test-message'))

    await monitoring.publish()

    const data = monitoring.getMetrics()

    expect(data.metrics).toEqual([
      {
        metricName: 'Errors',
        unit: 'Count',
        timestamp: null,
        dimensions: [
          { name: 'ErrorName', value: 'test-error' },
          { name: 'ErrorMessage', value: 'test-message' },
        ],
        values: [1],
        counts: [2],
      },
    ])
  })
})

describe('executions', () => {
  test('collects correct metrics without error', async () => {
    const monitoring = createMonitoring().group({
      'test-group-name': 'test-group',
    })

    monitoring.execution()

    const data = monitoring.getMetrics()

    expect(data.metrics).toEqual([
      {
        metricName: 'Executions',
        unit: 'Count',
        timestamp: null,
        dimensions: [{ name: 'test-group-name', value: 'test-group' }],
        values: [1],
        counts: [1],
      },
    ])
  })

  test('sends correct metrics with error', async () => {
    const monitoring = createMonitoring().group({
      'test-group-name': 'test-group',
    })

    class TestError extends Error {
      name = 'test-error'
    }

    monitoring.execution(new TestError('test-message'))

    const data = monitoring.getMetrics()

    expect(data.metrics).toEqual([
      {
        metricName: 'Executions',
        unit: 'Count',
        timestamp: null,
        dimensions: [{ name: 'test-group-name', value: 'test-group' }],
        values: [1],
        counts: [1],
      },
      {
        metricName: 'Errors',
        unit: 'Count',
        timestamp: null,
        dimensions: [
          { name: 'test-group-name', value: 'test-group' },
          { name: 'ErrorName', value: 'test-error' },
          { name: 'ErrorMessage', value: 'test-message' },
        ],
        values: [1],
        counts: [1],
      },
    ])
  })

  test('contains group dimensions for multiple group calls with error', async () => {
    const monitoring = createMonitoring()

    const groupMonitoring = monitoring
      .group({
        'first-group-name': 'first-group',
      })
      .group({
        'second-group-name': 'second-group',
      })

    class TestError extends Error {
      name = 'test-error'
    }

    groupMonitoring.execution(new TestError('test-message'))

    const data = monitoring.getMetrics()

    expect(data.metrics).toEqual([
      {
        metricName: 'Executions',
        unit: 'Count',
        timestamp: null,
        dimensions: [
          { name: 'first-group-name', value: 'first-group' },
          { name: 'second-group-name', value: 'second-group' },
        ],
        values: [1],
        counts: [1],
      },
      {
        metricName: 'Errors',
        unit: 'Count',
        timestamp: null,
        dimensions: [
          { name: 'first-group-name', value: 'first-group' },
          { name: 'second-group-name', value: 'second-group' },
          { name: 'ErrorName', value: 'test-error' },
          { name: 'ErrorMessage', value: 'test-message' },
        ],
        values: [1],
        counts: [1],
      },
    ])
  })
})

describe('duration', () => {
  test('collects correct metrics base data', async () => {
    const monitoring = createMonitoring()

    monitoring.duration('test-label', 1000)

    const data = monitoring.getMetrics()

    expect(data.metrics).toEqual([
      {
        metricName: 'Duration',
        unit: 'Milliseconds',
        timestamp: null,
        dimensions: [{ name: 'Label', value: 'test-label' }],
        values: [1000],
        counts: [1],
      },
    ])
  })

  test('collects correct metrics with custom count', async () => {
    const monitoring = createMonitoring()

    monitoring.duration('test-label', 1000, 5)

    const data = monitoring.getMetrics()

    expect(data.metrics).toEqual([
      {
        metricName: 'Duration',
        unit: 'Milliseconds',
        timestamp: null,
        dimensions: [{ name: 'Label', value: 'test-label' }],
        values: [1000],
        counts: [5],
      },
    ])
  })

  test('contains group dimensions', async () => {
    const monitoring = createMonitoring()

    const monitoringGroup = monitoring.group({
      'test-group': 'test-group-name',
    })

    monitoringGroup.duration('test-label', 1000)

    const data = monitoring.getMetrics()

    expect(data.metrics).toEqual([
      {
        metricName: 'Duration',
        unit: 'Milliseconds',
        timestamp: null,
        dimensions: [
          { name: 'test-group', value: 'test-group-name' },
          { name: 'Label', value: 'test-label' },
        ],
        values: [1000],
        counts: [1],
      },
    ])
  })

  test('collects correct metrics with multiple labels', async () => {
    const monitoring = createMonitoring()

    monitoring.duration('test-label-1', 1000)
    monitoring.duration('test-label-2', 1000)

    await monitoring.publish()

    const data = monitoring.getMetrics()

    expect(data.metrics).toEqual([
      {
        metricName: 'Duration',
        unit: 'Milliseconds',
        timestamp: null,
        dimensions: [{ name: 'Label', value: 'test-label-1' }],
        values: [1000],
        counts: [1],
      },
      {
        metricName: 'Duration',
        unit: 'Milliseconds',
        timestamp: null,
        dimensions: [{ name: 'Label', value: 'test-label-2' }],
        values: [1000],
        counts: [1],
      },
    ])
  })
})

describe('time and timeEnd', () => {
  test('collects correct metrics base data', async () => {
    const monitoring = createMonitoring()

    monitoring.time('test-label', 1000)
    monitoring.timeEnd('test-label', 2000)

    const data = monitoring.getMetrics()

    expect(data.metrics).toEqual([
      {
        metricName: 'Duration',
        unit: 'Milliseconds',
        timestamp: null,
        dimensions: [{ name: 'Label', value: 'test-label' }],
        values: [1000],
        counts: [1],
      },
    ])
  })

  test('contains group dimensions', async () => {
    const monitoring = createMonitoring()

    const monitoringGroup = monitoring.group({
      'test-group': 'test-group-name',
    })

    monitoringGroup.time('test-label', 1000)
    monitoringGroup.timeEnd('test-label', 2000)

    const data = monitoring.getMetrics()

    expect(data.metrics).toEqual([
      {
        metricName: 'Duration',
        unit: 'Milliseconds',
        timestamp: null,
        dimensions: [
          {
            name: 'test-group',
            value: 'test-group-name',
          },
          { name: 'Label', value: 'test-label' },
        ],
        values: [1000],
        counts: [1],
      },
    ])
  })

  test('sends correct duration metrics using Date.now', async () => {
    const monitoring = createMonitoring()

    mocked(Date.now).mockReturnValueOnce(15000).mockReturnValueOnce(19500)

    monitoring.time('test-label')
    monitoring.timeEnd('test-label')

    const data = monitoring.getMetrics()

    expect(data.metrics).toEqual([
      {
        metricName: 'Duration',
        unit: 'Milliseconds',
        timestamp: null,
        dimensions: [{ name: 'Label', value: 'test-label' }],
        values: [4500],
        counts: [1],
      },
    ])
  })

  test('collects correct metrics with multiple labels', async () => {
    const monitoring = createMonitoring()

    monitoring.time('test-label-1', 1000)
    monitoring.timeEnd('test-label-1', 2000)

    monitoring.time('test-label-2', 1000)
    monitoring.timeEnd('test-label-2', 2000)

    const data = monitoring.getMetrics()

    expect(data.metrics).toEqual([
      {
        metricName: 'Duration',
        unit: 'Milliseconds',
        timestamp: null,
        dimensions: [{ name: 'Label', value: 'test-label-1' }],
        values: [1000],
        counts: [1],
      },
      {
        metricName: 'Duration',
        unit: 'Milliseconds',
        timestamp: null,
        dimensions: [{ name: 'Label', value: 'test-label-2' }],
        values: [1000],
        counts: [1],
      },
    ])
  })

  test('collects correct metrics with same label multiple calls', async () => {
    const monitoring = createMonitoring()

    monitoring.time('test-label', 1000)
    monitoring.timeEnd('test-label', 2000)

    monitoring.time('test-label', 3500)
    monitoring.timeEnd('test-label', 4000)

    const data = monitoring.getMetrics()

    expect(data.metrics).toEqual([
      {
        metricName: 'Duration',
        unit: 'Milliseconds',
        timestamp: null,
        dimensions: [{ name: 'Label', value: 'test-label' }],
        values: [1000, 500],
        counts: [1, 1],
      },
    ])
  })
})

describe('rate', () => {
  test('sends correct metrics base data if seconds are specified', async () => {
    const monitoring = createMonitoring()

    monitoring.rate('applied-events', 15, 0.5)

    const data = monitoring.getMetrics()

    expect(data.metrics).toEqual([
      {
        metricName: 'applied-events',
        unit: 'Count/Second',
        timestamp: null,
        dimensions: [],
        values: [30],
        counts: [1],
      },
    ])
  })

  test('contains group dimensions', async () => {
    const monitoring = createMonitoring()

    const monitoringGroup = monitoring.group({
      'test-group': 'test-group-name',
    })

    monitoringGroup.rate('applied-events', 1000)

    const data = monitoring.getMetrics()

    expect(data.metrics).toEqual([
      {
        metricName: 'applied-events',
        unit: 'Count/Second',
        timestamp: null,
        dimensions: [{ name: 'test-group', value: 'test-group-name' }],
        values: [1000],
        counts: [1],
      },
    ])
  })
})
