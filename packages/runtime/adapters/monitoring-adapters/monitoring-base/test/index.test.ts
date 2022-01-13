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
  test('gets timestamp from function if it is passed into adapter', () => {
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

  test('sets timestamp as null if getTimestamp is NOT passed into adapter', () => {
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

  test('creates new metric with all same fields excluding timestamp', () => {
    const mockGetTimestamp = jest
      .fn()
      .mockReturnValueOnce(123)
      .mockReturnValueOnce(456)

    const monitoring = createMonitoring({
      getTimestamp: mockGetTimestamp,
    })

    monitoring.execution()
    monitoring.execution()

    const data = monitoring.getMetrics()

    expect(data.metrics).toEqual([
      {
        metricName: 'Executions',
        unit: 'Count',
        timestamp: 123,
        dimensions: [],
        values: [1],
        counts: [1],
      },
      {
        metricName: 'Executions',
        unit: 'Count',
        timestamp: 456,
        dimensions: [],
        values: [1],
        counts: [1],
      },
    ])
  })

  test('clears metrics correctly', () => {
    const monitoring = createMonitoring()

    monitoring.execution()

    expect(monitoring.getMetrics().metrics).toHaveLength(1)

    monitoring.clearMetrics()

    expect(monitoring.getMetrics().metrics).toHaveLength(0)
  })

  test('combines values in one metric if all params are the same', () => {
    const monitoring = createMonitoring()

    tion('test-label', 1000)
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

  test('combines values in one metric if all params are the same and value already in value list', () => {
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

  test('combines values in one metric if all params are the same and value already in value list', () => {
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

  test('mutation on got data does not lead to mutation in stored metrics', () => {
    const monitoring = createMonitoring()
    monitoring.duration('test-label', 500)
    const data = monitoring.getMetrics()

    data.metrics[0].metricName = 'some'
    data.metrics[0].unit = 'changes'
    data.metrics[0].dimensions[0].name = 'made'
    data.metrics[0].dimensions[0].value = 'outside'
    data.metrics[0].values[0] = 1234
    data.metrics[0].counts[0] = 4321

    expect(monitoring.getMetrics().metrics).toEqual([
      {
        metricName: 'Duration',
        unit: 'Milliseconds',
        timestamp: null,
        dimensions: [{ name: 'Label', value: 'test-label' }],
        values: [500],
        counts: [1],
      },
    ])
  })
})

describe('error', () => {
  test('contains default dimensions', () => {
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

  test('contains default and group dimensions', () => {
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

  test('contains default and group dimensions for multiple group calls', () => {
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

  test('contains correct metrics if different errors are passed', () => {
    const monitoring = createMonitoring()

    class TestError extends Error {
      name = 'test-error'
    }

    monitoring.error(new TestError('test-message-1'))
    monitoring.error(new TestError('test-message-2'))

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

  test('contains correct metrics if same error is passed multiple times', () => {
    const monitoring = createMonitoring()

    class TestError extends Error {
      name = 'test-error'
    }

    monitoring.error(new TestError('test-message'))
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
        counts: [2],
      },
    ])
  })
})

describe('executions', () => {
  test('collects correct metrics without error', () => {
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

  test('sends correct metrics with error', () => {
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

  test('contains group dimensions for multiple group calls with error', () => {
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
  test('collects correct metrics base data', () => {
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

  test('collects correct metrics with custom count', () => {
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

  test('contains group dimensions', () => {
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

  test('collects correct metrics with multiple labels', () => {
    const monitoring = createMonitoring()

    monitoring.duration('test-label-1', 1000)
    monitoring.duration('test-label-2', 1000)

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
  test('collects correct metrics base data', () => {
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

  test('contains group dimensions', () => {
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

  test('sends correct duration metrics using Date.now', () => {
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

  test('collects correct metrics with multiple labels', () => {
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

  test('collects correct metrics with same label multiple calls', () => {
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
  test('sends correct metrics base data if seconds are specified', () => {
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

  test('contains group dimensions', () => {
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

describe('custom', () => {
  test('collects correct metrics base data', () => {
    const monitoring = createMonitoring()

    monitoring.custom({
      metricName: 'test-name',
      unit: 'test-unit',
    })

    const data = monitoring.getMetrics()

    expect(data.metrics).toEqual([
      {
        metricName: 'test-name',
        unit: 'test-unit',
        timestamp: null,
        dimensions: [],
        values: [1],
        counts: [1],
      },
    ])
  })

  test('collects correct metrics base custom data', () => {
    const monitoring = createMonitoring()

    monitoring.custom({
      metricName: 'test-name',
      unit: 'test-unit',
      dimensions: [{ name: 'Label', value: 'test-value' }],
      count: 5,
      value: 4,
    })

    const data = monitoring.getMetrics()

    expect(data.metrics).toEqual([
      {
        metricName: 'test-name',
        unit: 'test-unit',
        timestamp: null,
        dimensions: [{ name: 'Label', value: 'test-value' }],
        values: [4],
        counts: [5],
      },
    ])
  })

  test('contains group dimensions', () => {
    const monitoring = createMonitoring()

    const monitoringGroup = monitoring.group({
      'test-group': 'test-group-name',
    })

    monitoringGroup.custom({
      metricName: 'test-name',
      unit: 'test-unit',
    })

    const data = monitoring.getMetrics()

    expect(data.metrics).toEqual([
      {
        metricName: 'test-name',
        unit: 'test-unit',
        timestamp: null,
        dimensions: [{ name: 'test-group', value: 'test-group-name' }],
        values: [1],
        counts: [1],
      },
    ])
  })

  test('contains group dimensions and provided ones', () => {
    const monitoring = createMonitoring()

    const monitoringGroup = monitoring.group({
      'test-group': 'test-group-name',
    })

    monitoringGroup.custom({
      metricName: 'test-name',
      unit: 'test-unit',
      dimensions: [{ name: 'Label', value: 'test-value' }],
    })

    const data = monitoring.getMetrics()

    expect(data.metrics).toEqual([
      {
        metricName: 'test-name',
        unit: 'test-unit',
        timestamp: null,
        dimensions: [
          { name: 'test-group', value: 'test-group-name' },
          { name: 'Label', value: 'test-value' },
        ],
        values: [1],
        counts: [1],
      },
    ])
  })
})
