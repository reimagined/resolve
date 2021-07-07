/* eslint-disable no-console */
import { putDurationMetrics } from '../../src/cloud/metrics'

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
      Namespace: 'ResolveJs',
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
      Namespace: 'ResolveJs',
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
      Namespace: 'ResolveJs',
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
      Namespace: 'ResolveJs',
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
      Namespace: 'ResolveJs',
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
      Namespace: 'ResolveJs',
    })
  })
})
