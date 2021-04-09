/* eslint-disable no-console */
import {
  putDurationMetrics,
  buildCommandMetricData,
  buildApiHandlerMetricData,
  buildSagaProjectionMetricData,
  buildReadModelProjectionMetricData,
  buildReadModelResolverMetricData,
  buildViewModelProjectionMetricData,
  buildViewModelResolverMetricData,
  buildInternalExecutionMetricData,
  buildDurationMetricData,
} from '../../src/cloud/metrics'

import CloudWatch from 'aws-sdk/clients/cloudwatch'

const lambdaContext = {
  getVacantTimeInMillis: jest.fn().mockReturnValue(1000),
}

const consoleInfoOldHandler = console.info

let originalEnv

beforeAll(() => {
  originalEnv = process.env
  process.env = {
    ...originalEnv,
    RESOLVE_DEPLOYMENT_ID: 'deployment-id',
  }
})

afterAll(() => {
  process.env = originalEnv
})

describe('put duration metrics', () => {
  beforeAll(async () => {
    console.info = jest.fn()
  })

  afterAll(async () => {
    console.info = consoleInfoOldHandler
  })

  beforeEach(async () => {
    console.info.mockClear()
    CloudWatch.putMetricData.mockClear()
    lambdaContext.getVacantTimeInMillis.mockClear()
  })

  afterEach(() => {})

  test('bootstrap metric', async () => {
    await putDurationMetrics(
      { part: 'bootstrapping' },
      lambdaContext,
      false,
      3000
    )
    expect(CloudWatch.putMetricData).toBeCalledTimes(1)
    expect(lambdaContext.getVacantTimeInMillis).toBeCalledTimes(1)
    expect(CloudWatch.putMetricData).toBeCalledWith({
      MetricData: [
        {
          Dimensions: [
            {
              Name: 'Deployment Id',
              Value: 'deployment-id',
            },
            {
              Name: 'Kind',
              Value: 'route',
            },
          ],
          MetricName: 'duration',
          Timestamp: expect.any(Date),
          Unit: 'Milliseconds',
          Value: 2000,
        },
      ],
      Namespace: 'RESOLVE_METRICS',
    })
    expect(console.info).toBeCalledWith(
      ['[REQUEST INFO]', 'route', '', 2000].join('\n')
    )
  })

  test('query metric', async () => {
    await putDurationMetrics(
      { path: '/deployment-id.resolve.sh/api/query/any' },
      lambdaContext,
      false,
      3000
    )
    expect(lambdaContext.getVacantTimeInMillis).toBeCalledTimes(1)
    expect(CloudWatch.putMetricData).toBeCalledTimes(1)
    expect(CloudWatch.putMetricData).toBeCalledWith({
      MetricData: [
        {
          Dimensions: [
            {
              Name: 'Deployment Id',
              Value: 'deployment-id',
            },
            {
              Name: 'Kind',
              Value: 'query',
            },
          ],
          MetricName: 'duration',
          Timestamp: expect.any(Date),
          Unit: 'Milliseconds',
          Value: 2000,
        },
      ],
      Namespace: 'RESOLVE_METRICS',
    })
    expect(console.info).toBeCalledWith(
      [
        '[REQUEST INFO]',
        'query',
        '/deployment-id.resolve.sh/api/query/any',
        2000,
      ].join('\n')
    )
  })

  test('command metric', async () => {
    await putDurationMetrics(
      { path: '/deployment-id.resolve.sh/api/commands/any' },
      lambdaContext,
      false,
      3000
    )
    expect(lambdaContext.getVacantTimeInMillis).toBeCalledTimes(1)
    expect(CloudWatch.putMetricData).toBeCalledTimes(1)
    expect(CloudWatch.putMetricData).toBeCalledWith({
      MetricData: [
        {
          Dimensions: [
            {
              Name: 'Deployment Id',
              Value: 'deployment-id',
            },
            {
              Name: 'Kind',
              Value: 'command',
            },
          ],
          MetricName: 'duration',
          Timestamp: expect.any(Date),
          Unit: 'Milliseconds',
          Value: 2000,
        },
      ],
      Namespace: 'RESOLVE_METRICS',
    })
    expect(console.info).toBeCalledWith(
      [
        '[REQUEST INFO]',
        'command',
        '/deployment-id.resolve.sh/api/commands/any',
        2000,
      ].join('\n')
    )
  })

  test('route metric', async () => {
    await putDurationMetrics(
      { path: '/deployment-id.resolve.sh/any-route' },
      lambdaContext,
      false,
      3000
    )
    expect(lambdaContext.getVacantTimeInMillis).toBeCalledTimes(1)
    expect(CloudWatch.putMetricData).toBeCalledTimes(1)
    expect(CloudWatch.putMetricData).toBeCalledWith({
      MetricData: [
        {
          Dimensions: [
            {
              Name: 'Deployment Id',
              Value: 'deployment-id',
            },
            {
              Name: 'Kind',
              Value: 'route',
            },
          ],
          MetricName: 'duration',
          Timestamp: expect.any(Date),
          Unit: 'Milliseconds',
          Value: 2000,
        },
      ],
      Namespace: 'RESOLVE_METRICS',
    })
    expect(console.info).toBeCalledWith(
      [
        '[REQUEST INFO]',
        'route',
        '/deployment-id.resolve.sh/any-route',
        2000,
      ].join('\n')
    )
  })

  test('subscribe metric', async () => {
    await putDurationMetrics(
      { path: '/deployment-id.resolve.sh/api/subscribe' },
      lambdaContext,
      false,
      3000
    )
    expect(lambdaContext.getVacantTimeInMillis).toBeCalledTimes(1)
    expect(CloudWatch.putMetricData).toBeCalledTimes(1)
    expect(CloudWatch.putMetricData).toBeCalledWith({
      MetricData: [
        {
          Dimensions: [
            {
              Name: 'Deployment Id',
              Value: 'deployment-id',
            },
            {
              Name: 'Kind',
              Value: 'subscribe',
            },
          ],
          MetricName: 'duration',
          Timestamp: expect.any(Date),
          Unit: 'Milliseconds',
          Value: 2000,
        },
      ],
      Namespace: 'RESOLVE_METRICS',
    })
    expect(console.info).toBeCalledWith(
      [
        '[REQUEST INFO]',
        'subscribe',
        '/deployment-id.resolve.sh/api/subscribe',
        2000,
      ].join('\n')
    )
  })

  test('cold start metric', async () => {
    await putDurationMetrics(
      { path: '/deployment-id.resolve.sh/any-route' },
      lambdaContext,
      true,
      3000
    )
    expect(lambdaContext.getVacantTimeInMillis).toBeCalledTimes(1)
    expect(CloudWatch.putMetricData).toBeCalledTimes(1)
    expect(CloudWatch.putMetricData).toBeCalledWith({
      MetricData: [
        {
          Dimensions: [
            {
              Name: 'Deployment Id',
              Value: 'deployment-id',
            },
            {
              Name: 'Kind',
              Value: 'route',
            },
          ],
          MetricName: 'duration',
          Timestamp: expect.any(Date),
          Unit: 'Milliseconds',
          Value: 2000,
        },
        {
          Dimensions: [
            {
              Name: 'Deployment Id',
              Value: 'deployment-id',
            },
            {
              Name: 'Kind',
              Value: 'cold start',
            },
          ],
          MetricName: 'duration',
          Timestamp: expect.any(Date),
          Unit: 'Milliseconds',
          Value: 897000,
        },
      ],
      Namespace: 'RESOLVE_METRICS',
    })
  })
})

describe('error metric data', () => {
  test('buildCommandMetricData', () => {
    class CustomError extends Error {
      name = 'CustomError'
    }

    const metricData = buildCommandMetricData(
      'test-aggregate',
      'test-command',
      'test-id',
      new CustomError('test-error')
    )

    expect(metricData).toHaveLength(11)

    for (const metricItem of metricData) {
      expect(metricItem).toEqual(
        expect.objectContaining({
          MetricName: 'Errors',
          Timestamp: expect.any(Date),
          Unit: 'Count',
          Value: 1,
        })
      )
    }

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'Part',
              Value: 'Command',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'Part',
              Value: 'Command',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'Part',
              Value: 'Command',
            },
            {
              Name: 'AggregateName',
              Value: 'test-aggregate',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'Part',
              Value: 'Command',
            },
            {
              Name: 'AggregateName',
              Value: 'test-aggregate',
            },
            {
              Name: 'CommandType',
              Value: 'test-command',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'Part',
              Value: 'Command',
            },
            {
              Name: 'AggregateName',
              Value: 'test-aggregate',
            },
            {
              Name: 'CommandType',
              Value: 'test-command',
            },
            {
              Name: 'AggregateId',
              Value: 'test-id',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'ErrorName',
              Value: 'CustomError',
            },
            {
              Name: 'ErrorMessage',
              Value: 'test-error',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'ErrorName',
              Value: 'CustomError',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'ErrorName',
              Value: 'CustomError',
            },
            {
              Name: 'ErrorMessage',
              Value: 'test-error',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'Part',
              Value: 'Command',
            },
            {
              Name: 'AggregateName',
              Value: 'test-aggregate',
            },
            {
              Name: 'CommandType',
              Value: 'test-command',
            },
            {
              Name: 'AggregateId',
              Value: 'test-id',
            },
            {
              Name: 'ErrorName',
              Value: 'CustomError',
            },
            {
              Name: 'ErrorMessage',
              Value: 'test-error',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'Part',
              Value: 'Command',
            },
            {
              Name: 'AggregateName',
              Value: 'test-aggregate',
            },
            {
              Name: 'CommandType',
              Value: 'test-command',
            },
            {
              Name: 'AggregateId',
              Value: 'test-id',
            },
            {
              Name: 'ErrorName',
              Value: 'CustomError',
            },
          ],
        }),
      ])
    )
  })

  test('buildReadModelProjectionMetricData', () => {
    class CustomError extends Error {
      name = 'CustomError'
    }

    const metricData = buildReadModelProjectionMetricData(
      'test-read-model',
      'test-event',
      new CustomError('test-error')
    )

    expect(metricData).toHaveLength(10)

    for (const metricItem of metricData) {
      expect(metricItem).toEqual(
        expect.objectContaining({
          MetricName: 'Errors',
          Timestamp: expect.any(Date),
          Unit: 'Count',
          Value: 1,
        })
      )
    }

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'Part',
              Value: 'ReadModelProjection',
            },
            {
              Name: 'ReadModel',
              Value: 'test-read-model',
            },
            {
              Name: 'EventType',
              Value: 'test-event',
            },
            {
              Name: 'ErrorName',
              Value: 'CustomError',
            },
            {
              Name: 'ErrorMessage',
              Value: 'test-error',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'Part',
              Value: 'ReadModelProjection',
            },
            {
              Name: 'ErrorName',
              Value: 'CustomError',
            },
            {
              Name: 'ErrorMessage',
              Value: 'test-error',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'ErrorName',
              Value: 'CustomError',
            },
            {
              Name: 'ErrorMessage',
              Value: 'test-error',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'Part',
              Value: 'ReadModelProjection',
            },
            {
              Name: 'ReadModel',
              Value: 'test-read-model',
            },
            {
              Name: 'EventType',
              Value: 'test-event',
            },
            {
              Name: 'ErrorName',
              Value: 'CustomError',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'Part',
              Value: 'ReadModelProjection',
            },
            {
              Name: 'ErrorName',
              Value: 'CustomError',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'Part',
              Value: 'ReadModelProjection',
            },
            {
              Name: 'ReadModel',
              Value: 'test-read-model',
            },
            {
              Name: 'EventType',
              Value: 'test-event',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'Part',
              Value: 'ReadModelProjection',
            },
            {
              Name: 'ReadModel',
              Value: 'test-read-model',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'Part',
              Value: 'ReadModelProjection',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
          ],
        }),
      ])
    )
  })

  test('buildReadModelResolverMetricData', () => {
    class CustomError extends Error {
      name = 'CustomError'
    }

    const metricData = buildReadModelResolverMetricData(
      'test-read-model',
      'test-resolver',
      new CustomError('test-error')
    )

    expect(metricData).toHaveLength(10)

    for (const metricItem of metricData) {
      expect(metricItem).toEqual(
        expect.objectContaining({
          MetricName: 'Errors',
          Timestamp: expect.any(Date),
          Unit: 'Count',
          Value: 1,
        })
      )
    }

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'Part',
              Value: 'ReadModelResolver',
            },
            {
              Name: 'ReadModel',
              Value: 'test-read-model',
            },
            {
              Name: 'Resolver',
              Value: 'test-resolver',
            },
            {
              Name: 'ErrorName',
              Value: 'CustomError',
            },
            {
              Name: 'ErrorMessage',
              Value: 'test-error',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'Part',
              Value: 'ReadModelResolver',
            },
            {
              Name: 'ErrorName',
              Value: 'CustomError',
            },
            {
              Name: 'ErrorMessage',
              Value: 'test-error',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'ErrorName',
              Value: 'CustomError',
            },
            {
              Name: 'ErrorMessage',
              Value: 'test-error',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'Part',
              Value: 'ReadModelResolver',
            },
            {
              Name: 'ReadModel',
              Value: 'test-read-model',
            },
            {
              Name: 'Resolver',
              Value: 'test-resolver',
            },
            {
              Name: 'ErrorName',
              Value: 'CustomError',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'Part',
              Value: 'ReadModelResolver',
            },
            {
              Name: 'ErrorName',
              Value: 'CustomError',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'Part',
              Value: 'ReadModelResolver',
            },
            {
              Name: 'ReadModel',
              Value: 'test-read-model',
            },
            {
              Name: 'Resolver',
              Value: 'test-resolver',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'Part',
              Value: 'ReadModelResolver',
            },
            {
              Name: 'ReadModel',
              Value: 'test-read-model',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'Part',
              Value: 'ReadModelResolver',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
          ],
        }),
      ])
    )
  })

  test('buildViewModelProjectionMetricData', () => {
    class CustomError extends Error {
      name = 'CustomError'
    }

    const metricData = buildViewModelProjectionMetricData(
      'test-view-model',
      'test-event',
      new CustomError('test-error')
    )

    expect(metricData).toHaveLength(10)

    for (const metricItem of metricData) {
      expect(metricItem).toEqual(
        expect.objectContaining({
          MetricName: 'Errors',
          Timestamp: expect.any(Date),
          Unit: 'Count',
          Value: 1,
        })
      )
    }

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'Part',
              Value: 'ViewModelProjection',
            },
            {
              Name: 'ViewModel',
              Value: 'test-view-model',
            },
            {
              Name: 'EventType',
              Value: 'test-event',
            },
            {
              Name: 'ErrorName',
              Value: 'CustomError',
            },
            {
              Name: 'ErrorMessage',
              Value: 'test-error',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'Part',
              Value: 'ViewModelProjection',
            },
            {
              Name: 'ErrorName',
              Value: 'CustomError',
            },
            {
              Name: 'ErrorMessage',
              Value: 'test-error',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'ErrorName',
              Value: 'CustomError',
            },
            {
              Name: 'ErrorMessage',
              Value: 'test-error',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'Part',
              Value: 'ViewModelProjection',
            },
            {
              Name: 'ViewModel',
              Value: 'test-view-model',
            },
            {
              Name: 'EventType',
              Value: 'test-event',
            },
            {
              Name: 'ErrorName',
              Value: 'CustomError',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'Part',
              Value: 'ViewModelProjection',
            },
            {
              Name: 'ErrorName',
              Value: 'CustomError',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'Part',
              Value: 'ViewModelProjection',
            },
            {
              Name: 'ViewModel',
              Value: 'test-view-model',
            },
            {
              Name: 'EventType',
              Value: 'test-event',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'Part',
              Value: 'ViewModelProjection',
            },
            {
              Name: 'ViewModel',
              Value: 'test-view-model',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'Part',
              Value: 'ViewModelProjection',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
          ],
        }),
      ])
    )
  })

  test('buildViewModelResolverMetricData', () => {
    class CustomError extends Error {
      name = 'CustomError'
    }

    const metricData = buildViewModelResolverMetricData(
      'test-view-model',
      new CustomError('test-error')
    )

    expect(metricData).toHaveLength(9)

    for (const metricItem of metricData) {
      expect(metricItem).toEqual(
        expect.objectContaining({
          MetricName: 'Errors',
          Timestamp: expect.any(Date),
          Unit: 'Count',
          Value: 1,
        })
      )
    }

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'Part',
              Value: 'ViewModelResolver',
            },
            {
              Name: 'ViewModel',
              Value: 'test-view-model',
            },
            {
              Name: 'ErrorName',
              Value: 'CustomError',
            },
            {
              Name: 'ErrorMessage',
              Value: 'test-error',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'Part',
              Value: 'ViewModelResolver',
            },
            {
              Name: 'ErrorName',
              Value: 'CustomError',
            },
            {
              Name: 'ErrorMessage',
              Value: 'test-error',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'ErrorName',
              Value: 'CustomError',
            },
            {
              Name: 'ErrorMessage',
              Value: 'test-error',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'Part',
              Value: 'ViewModelResolver',
            },
            {
              Name: 'ViewModel',
              Value: 'test-view-model',
            },
            {
              Name: 'ErrorName',
              Value: 'CustomError',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'Part',
              Value: 'ViewModelResolver',
            },
            {
              Name: 'ErrorName',
              Value: 'CustomError',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'Part',
              Value: 'ViewModelResolver',
            },
            {
              Name: 'ViewModel',
              Value: 'test-view-model',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'Part',
              Value: 'ViewModelResolver',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
          ],
        }),
      ])
    )
  })

  test('buildSagaProjectionMetricData', () => {
    class CustomError extends Error {
      name = 'CustomError'
    }

    const metricData = buildSagaProjectionMetricData(
      'test-saga',
      'test-event',
      new CustomError('test-error')
    )

    expect(metricData).toHaveLength(10)

    for (const metricItem of metricData) {
      expect(metricItem).toEqual(
        expect.objectContaining({
          MetricName: 'Errors',
          Timestamp: expect.any(Date),
          Unit: 'Count',
          Value: 1,
        })
      )
    }

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'Part',
              Value: 'SagaProjection',
            },
            {
              Name: 'Saga',
              Value: 'test-saga',
            },
            {
              Name: 'EventType',
              Value: 'test-event',
            },
            {
              Name: 'ErrorName',
              Value: 'CustomError',
            },
            {
              Name: 'ErrorMessage',
              Value: 'test-error',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'Part',
              Value: 'SagaProjection',
            },
            {
              Name: 'ErrorName',
              Value: 'CustomError',
            },
            {
              Name: 'ErrorMessage',
              Value: 'test-error',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'ErrorName',
              Value: 'CustomError',
            },
            {
              Name: 'ErrorMessage',
              Value: 'test-error',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'Part',
              Value: 'SagaProjection',
            },
            {
              Name: 'Saga',
              Value: 'test-saga',
            },
            {
              Name: 'EventType',
              Value: 'test-event',
            },
            {
              Name: 'ErrorName',
              Value: 'CustomError',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'Part',
              Value: 'SagaProjection',
            },
            {
              Name: 'ErrorName',
              Value: 'CustomError',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'Part',
              Value: 'SagaProjection',
            },
            {
              Name: 'Saga',
              Value: 'test-saga',
            },
            {
              Name: 'EventType',
              Value: 'test-event',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'Part',
              Value: 'SagaProjection',
            },
            {
              Name: 'Saga',
              Value: 'test-saga',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'Part',
              Value: 'SagaProjection',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
          ],
        }),
      ])
    )
  })

  test('buildApiHandlerMetricData', () => {
    class CustomError extends Error {
      name = 'CustomError'
    }

    const metricData = buildApiHandlerMetricData(
      '/api/test',
      new CustomError('test-error')
    )

    expect(metricData).toHaveLength(9)

    for (const metricItem of metricData) {
      expect(metricItem).toEqual(
        expect.objectContaining({
          MetricName: 'Errors',
          Timestamp: expect.any(Date),
          Unit: 'Count',
          Value: 1,
        })
      )
    }

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'Part',
              Value: 'ApiHandler',
            },
            {
              Name: 'Path',
              Value: '/api/test',
            },
            {
              Name: 'ErrorName',
              Value: 'CustomError',
            },
            {
              Name: 'ErrorMessage',
              Value: 'test-error',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'Part',
              Value: 'ApiHandler',
            },
            {
              Name: 'ErrorName',
              Value: 'CustomError',
            },
            {
              Name: 'ErrorMessage',
              Value: 'test-error',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'ErrorName',
              Value: 'CustomError',
            },
            {
              Name: 'ErrorMessage',
              Value: 'test-error',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'Part',
              Value: 'ApiHandler',
            },
            {
              Name: 'Path',
              Value: '/api/test',
            },
            {
              Name: 'ErrorName',
              Value: 'CustomError',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'Part',
              Value: 'ApiHandler',
            },
            {
              Name: 'Path',
              Value: '/api/test',
            },
            {
              Name: 'ErrorName',
              Value: 'CustomError',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'Part',
              Value: 'ApiHandler',
            },
            {
              Name: 'Path',
              Value: '/api/test',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'Part',
              Value: 'ApiHandler',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
          ],
        }),
      ])
    )
  })

  test('buildInternalExecutionMetricData', () => {
    class CustomError extends Error {
      name = 'CustomError'
    }

    const metricData = buildInternalExecutionMetricData(
      new CustomError('test-error')
    )

    expect(metricData).toHaveLength(6)

    for (const metricItem of metricData) {
      expect(metricItem).toEqual(
        expect.objectContaining({
          MetricName: 'Errors',
          Timestamp: expect.any(Date),
          Unit: 'Count',
          Value: 1,
        })
      )
    }

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'Part',
              Value: 'Internal',
            },
            {
              Name: 'ErrorName',
              Value: 'CustomError',
            },
            {
              Name: 'ErrorMessage',
              Value: 'test-error',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'ErrorName',
              Value: 'CustomError',
            },
            {
              Name: 'ErrorMessage',
              Value: 'test-error',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'Part',
              Value: 'Internal',
            },
            {
              Name: 'ErrorName',
              Value: 'CustomError',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'ErrorName',
              Value: 'CustomError',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'Part',
              Value: 'Internal',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
          ],
        }),
      ])
    )
  })
})

describe('duration metric data', () => {
  test('buildDurationMetricData', () => {
    const metricData = buildDurationMetricData(
      'test-label',
      '1.0.0-test',
      15000
    )

    expect(metricData).toHaveLength(3)

    for (const metricItem of metricData) {
      expect(metricItem).toEqual(
        expect.objectContaining({
          MetricName: 'Duration',
          Timestamp: expect.any(Date),
          Unit: 'Milliseconds',
          Value: 15000,
        })
      )
    }

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'ResolveVersion',
              Value: '1.0.0-test',
            },
            {
              Name: 'Label',
              Value: 'test-label',
            },
          ],
        }),
      ])
    )

    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'DeploymentId',
              Value: 'deployment-id',
            },
            {
              Name: 'Label',
              Value: 'test-label',
            },
          ],
        }),
      ])
    )
    expect(metricData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dimensions: [
            {
              Name: 'ResolveVersion',
              Value: '1.0.0-test',
            },
            {
              Name: 'Label',
              Value: 'test-label',
            },
          ],
        }),
      ])
    )
  })
})
