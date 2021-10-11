// TODO: migrate to TS
import type { Request, AWSError } from 'aws-sdk'
import CloudWatch, { PutMetricDataInput } from 'aws-sdk/clients/cloudwatch'
import { mocked } from 'ts-jest/utils'

import createMonitoring from '../src'

const mockGetMetrics = jest.fn()
const mockClearMetrics = jest.fn()
const mockGroup = jest.fn()
const mockError = jest.fn()
const mockExecution = jest.fn()
const mockDuration = jest.fn()
const mockTime = jest.fn()
const mockTimeEnd = jest.fn()
const mockRate = jest.fn()

jest.mock('@resolve-js/monitoring-base', () => () => ({
  getMetrics: mockGetMetrics,
  clearMetrics: mockClearMetrics,
  group: mockGroup,
  error: mockError,
  execution: mockExecution,
  duration: mockDuration,
  time: mockTime,
  timeEnd: mockTimeEnd,
  rate: mockRate,
}))

afterEach(() => {
  mocked(CloudWatch.prototype.putMetricData).mockClear()
})

let originalNow: typeof Date.now
let dateSpy: jest.SpyInstance | null

beforeEach(() => {
  originalNow = Date.now
  Date.now = jest.fn().mockReturnValue(1234)
})

afterEach(() => {
  Date.now = originalNow

  if (dateSpy != null) {
    dateSpy.mockRestore()
    dateSpy = null
  }

  mockGetMetrics.mockClear()
  mockClearMetrics.mockClear()
  mockGroup.mockClear()
  mockError.mockClear()
  mockExecution.mockClear()
  mockDuration.mockClear()
  mockTime.mockClear()
  mockTimeEnd.mockClear()
  mockRate.mockClear()
})

describe('publish', () => {
  test('sends metric data on publish and clears it in base adapter', async () => {
    mockGetMetrics.mockReturnValue({
      metrics: [
        {
          metricName: 'Errors',
          dimensions: [{ name: 'Part', value: 'Command' }],
          timestamp: 0,
          values: [1],
          counts: [1],
        },
      ],
    })

    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    await monitoring.publish()

    expect(CloudWatch.prototype.putMetricData).toBeCalledTimes(1)

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith({
      Namespace: 'ResolveJs',
      MetricData: expect.any(Array),
    })

    expect(mockClearMetrics).toBeCalledTimes(1)
  })

  test('does nothing with no metric data on publish', async () => {
    mockGetMetrics.mockReturnValue({
      metrics: [],
    })

    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    await monitoring.publish()

    expect(CloudWatch.prototype.putMetricData).toBeCalledTimes(0)
  })

  test('sends metric data multiple times on multiple publish call', async () => {
    mockGetMetrics
      .mockReturnValueOnce({
        metrics: [
          {
            metricName: 'Errors',
            dimensions: [
              { name: 'Part', value: 'Command' },
              { name: 'ErrorName', value: 'Error' },
              { name: 'ErrorMessage', value: 'test-1' },
            ],
            timestamp: 0,
            values: [1],
            counts: [1],
          },
        ],
      })
      .mockReturnValueOnce({
        metrics: [
          {
            metricName: 'Errors',
            dimensions: [
              { name: 'Part', value: 'Command' },
              { name: 'ErrorName', value: 'Error' },
              { name: 'ErrorMessage', value: 'test-2' },
            ],
            timestamp: 0,
            values: [1],
            counts: [1],
          },
        ],
      })

    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    await monitoring.publish()
    await monitoring.publish()

    expect(CloudWatch.prototype.putMetricData).toBeCalledTimes(2)

    expect(CloudWatch.prototype.putMetricData).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'Part', Value: 'Command' },
              { Name: 'ErrorName', Value: 'Error' },
              { Name: 'ErrorMessage', Value: 'test-1' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.prototype.putMetricData).not.toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'Part', Value: 'Command' },
              { Name: 'ErrorName', Value: 'Error' },
              { Name: 'ErrorMessage', Value: 'test-2' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.prototype.putMetricData).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'Part', Value: 'Command' },
              { Name: 'ErrorName', Value: 'Error' },
              { Name: 'ErrorMessage', Value: 'test-2' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.prototype.putMetricData).not.toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'Part', Value: 'Command' },
              { Name: 'ErrorName', Value: 'Error' },
              { Name: 'ErrorMessage', Value: 'test-1' },
            ],
          }),
        ]),
      })
    )
  })

  test('sends multiple metric data in a single request', async () => {
    mockGetMetrics.mockReturnValue({
      metrics: [
        {
          metricName: 'Errors',
          unit: 'count',
          dimensions: [
            { name: 'ErrorName', value: 'Error' },
            { name: 'ErrorMessage', value: 'test-error' },
          ],
          timestamp: 0,
          values: [1],
          counts: [1],
        },
        {
          metricName: 'Duration',
          unit: 'milliseconds',
          dimensions: [{ name: 'Label', value: 'test-label' }],
          timestamp: 0,
          values: [300],
          counts: [1],
        },
      ],
    })

    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    await monitoring.publish()

    expect(CloudWatch.prototype.putMetricData).toBeCalledTimes(1)

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          {
            MetricName: 'Errors',
            Unit: 'Count',
            Values: [1],
            Counts: [1],
            Timestamp: expect.any(Date),
            Dimensions: expect.any(Array),
          },
        ]),
      })
    )

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          {
            MetricName: 'Duration',
            Unit: 'Milliseconds',
            Values: [300],
            Counts: [1],
            Timestamp: expect.any(Date),
            Dimensions: expect.any(Array),
          },
        ]),
      })
    )
  })

  test('cuts off dimension value if it is greater than 256', async () => {
    mockGetMetrics.mockReturnValue({
      metrics: [
        {
          metricName: 'Errors',
          unit: 'count',
          dimensions: [
            { name: 'Part', value: 'Command' },
            { name: 'ErrorName', value: 'Error' },
            {
              name: 'ErrorMessage',
              value: Array.from({ length: 300 }).fill('a').join(''),
            },
          ],
          timestamp: 0,
          values: [1],
          counts: [1],
        },
      ],
    })

    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    await monitoring.publish()

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'Part', Value: 'Command' },
              { Name: 'ErrorName', Value: 'Error' },
              {
                Name: 'ErrorMessage',
                Value: `${Array.from({ length: 253 }).fill('a').join('')}...`,
              },
            ],
          }),
        ]),
      })
    )
  })

  test('splits metrics sending if metric data array has length more than 20', async () => {
    mockGetMetrics.mockReturnValue({
      metrics: Array.from({ length: 8 }, () => ({
        metricName: 'Errors',
        unit: 'count',
        dimensions: [
          { name: 'ErrorName', value: 'Error' },
          { name: 'ErrorMessage', value: 'test-error' },
        ],
        timestamp: 0,
        values: [1],
        counts: [1],
      })),
    })

    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    await monitoring.publish()

    expect(CloudWatch.prototype.putMetricData).toBeCalledTimes(2)

    expect(
      ((mocked(CloudWatch.prototype.putMetricData).mock
        .calls[0][0] as unknown) as PutMetricDataInput).MetricData
    ).toHaveLength(20)

    expect(
      ((mocked(CloudWatch.prototype.putMetricData).mock
        .calls[1][0] as unknown) as PutMetricDataInput).MetricData
    ).toHaveLength(4)
  })

  test('does not reject on publish if putMetricData is failed', async () => {
    mockGetMetrics.mockReturnValue({
      metrics: [
        {
          metricName: 'Errors',
          unit: 'count',
          dimensions: [
            { name: 'DeploymentId', value: 'test-deployment' },
            { name: 'ErrorName', value: 'Error' },
            { name: 'ErrorMessage', value: 'test-error' },
          ],
          timestamp: 0,
          values: [1],
          counts: [1],
        },
      ],
    })

    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    mocked(CloudWatch.prototype.putMetricData).mockReturnValueOnce({
      promise: () => Promise.reject(new Error('Something went wrong')),
    } as Request<PutMetricDataInput, AWSError>)

    await monitoring.publish()
  })
})

describe('Errors', () => {
  test('sends correct metrics base data', async () => {
    mockGetMetrics.mockReturnValue({
      metrics: [
        {
          metricName: 'Errors',
          unit: 'count',
          dimensions: [
            { name: 'ErrorName', value: 'test-error' },
            { name: 'ErrorMessage', value: 'test-message' },
          ],
          timestamp: 0,
          values: [1],
          counts: [1],
        },
      ],
    })

    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    await monitoring.publish()

    const metricData = ((mocked(CloudWatch.prototype.putMetricData).mock
      .calls[0][0] as unknown) as PutMetricDataInput).MetricData

    for (const item of metricData) {
      expect(item).toEqual({
        MetricName: 'Errors',
        Unit: 'Count',
        Values: [1],
        Counts: [1],
        Timestamp: expect.any(Date),
        Dimensions: expect.any(Array),
      })
    }
  })

  test('sends multiple dimensions including deploymentId', async () => {
    mockGetMetrics.mockReturnValue({
      metrics: [
        {
          metricName: 'Errors',
          unit: 'count',
          dimensions: [
            { name: 'ErrorName', value: 'test-error' },
            { name: 'ErrorMessage', value: 'test-message' },
          ],
          timestamp: 0,
          values: [1],
          counts: [1],
        },
      ],
    })

    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    await monitoring.publish()

    expect(
      ((mocked(CloudWatch.prototype.putMetricData).mock
        .calls[0][0] as unknown) as PutMetricDataInput).MetricData
    ).toHaveLength(3)

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'ErrorName', Value: 'test-error' },
              { Name: 'ErrorMessage', Value: 'test-message' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'ErrorName', Value: 'test-error' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [{ Name: 'DeploymentId', Value: 'test-deployment' }],
          }),
        ]),
      })
    )
  })

  test('contains default and group dimensions', async () => {
    mockGetMetrics.mockReturnValue({
      metrics: [
        {
          metricName: 'Errors',
          unit: 'count',
          dimensions: [
            { name: 'test-group-name', value: 'test-group' },
            { name: 'ErrorName', value: 'test-error' },
            { name: 'ErrorMessage', value: 'test-message' },
          ],
          timestamp: 0,
          values: [1],
          counts: [1],
        },
      ],
    })

    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    await monitoring.publish()

    expect(
      ((mocked(CloudWatch.prototype.putMetricData).mock
        .calls[0][0] as unknown) as PutMetricDataInput).MetricData
    ).toHaveLength(6)

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'test-group-name', Value: 'test-group' },
              { Name: 'ErrorName', Value: 'test-error' },
              { Name: 'ErrorMessage', Value: 'test-message' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'test-group-name', Value: 'test-group' },
              { Name: 'ErrorName', Value: 'test-error' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'test-group-name', Value: 'test-group' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'ErrorName', Value: 'test-error' },
              { Name: 'ErrorMessage', Value: 'test-message' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'ErrorName', Value: 'test-error' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [{ Name: 'DeploymentId', Value: 'test-deployment' }],
          }),
        ]),
      })
    )
  })

  test('contains default and group dimensions for multiple group calls', async () => {
    mockGetMetrics.mockReturnValue({
      metrics: [
        {
          metricName: 'Errors',
          unit: 'count',
          dimensions: [
            { name: 'first-group-name', value: 'first-group' },
            { name: 'second-group-name', value: 'second-group' },
            { name: 'ErrorName', value: 'test-error' },
            { name: 'ErrorMessage', value: 'test-message' },
          ],
          timestamp: 0,
          values: [1],
          counts: [1],
        },
      ],
    })

    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    await monitoring.publish()

    expect(
      ((mocked(CloudWatch.prototype.putMetricData).mock
        .calls[0][0] as unknown) as PutMetricDataInput).MetricData
    ).toHaveLength(9)

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'first-group-name', Value: 'first-group' },
              { Name: 'second-group-name', Value: 'second-group' },
              { Name: 'ErrorName', Value: 'test-error' },
              { Name: 'ErrorMessage', Value: 'test-message' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'first-group-name', Value: 'first-group' },
              { Name: 'second-group-name', Value: 'second-group' },
              { Name: 'ErrorName', Value: 'test-error' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'first-group-name', Value: 'first-group' },
              { Name: 'second-group-name', Value: 'second-group' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'first-group-name', Value: 'first-group' },
              { Name: 'ErrorName', Value: 'test-error' },
              { Name: 'ErrorMessage', Value: 'test-message' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'first-group-name', Value: 'first-group' },
              { Name: 'ErrorName', Value: 'test-error' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'first-group-name', Value: 'first-group' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'ErrorName', Value: 'test-error' },
              { Name: 'ErrorMessage', Value: 'test-message' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'ErrorName', Value: 'test-error' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [{ Name: 'DeploymentId', Value: 'test-deployment' }],
          }),
        ]),
      })
    )
  })

  test('contains correct dimensions if multiple errors are passed', async () => {
    mockGetMetrics.mockReturnValue({
      metrics: [
        {
          metricName: 'Errors',
          unit: 'count',
          dimensions: [
            { name: 'ErrorName', value: 'test-error' },
            { name: 'ErrorMessage', value: 'test-message-1' },
          ],
          timestamp: 0,
          values: [1],
          counts: [1],
        },
        {
          metricName: 'Errors',
          unit: 'count',
          dimensions: [
            { name: 'ErrorName', value: 'test-error' },
            { name: 'ErrorMessage', value: 'test-message-2' },
          ],
          timestamp: 0,
          values: [1],
          counts: [1],
        },
      ],
    })

    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    await monitoring.publish()

    expect(
      ((mocked(CloudWatch.prototype.putMetricData).mock
        .calls[0][0] as unknown) as PutMetricDataInput).MetricData
    ).toHaveLength(6)

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'ErrorName', Value: 'test-error' },
              { Name: 'ErrorMessage', Value: 'test-message-2' },
            ],
          }),
        ]),
      })
    )
  })

  test('contains global dimensions if Part dimension is specified', async () => {
    mockGetMetrics.mockReturnValue({
      metrics: [
        {
          metricName: 'Errors',
          unit: 'count',
          dimensions: [
            { name: 'Part', value: 'test-part' },
            { name: 'ErrorName', value: 'test-error' },
            { name: 'ErrorMessage', value: 'test-message' },
          ],
          timestamp: 0,
          values: [1],
          counts: [1],
        },
      ],
    })

    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    await monitoring.publish()

    expect(
      ((mocked(CloudWatch.prototype.putMetricData).mock
        .calls[0][0] as unknown) as PutMetricDataInput).MetricData
    ).toHaveLength(7)

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [{ Name: 'Part', Value: 'test-part' }],
          }),
        ]),
      })
    )

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'Part', Value: 'test-part' },
              { Name: 'ErrorName', Value: 'test-error' },
              { Name: 'ErrorMessage', Value: 'test-message' },
            ],
          }),
        ]),
      })
    )
  })
})

describe('Executions', () => {
  test('sends metrics with various dimension combinations', async () => {
    mockGetMetrics.mockReturnValue({
      metrics: [
        {
          metricName: 'Executions',
          unit: 'count',
          dimensions: [
            { name: 'test-group-name', value: 'test-group' },
          ],
          timestamp: 0,
          values: [1],
          counts: [1],
        },
      ],
    })

    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    await monitoring.publish()

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          {
            MetricName: 'Executions',
            Unit: 'Count',
            Values: [1],
            Counts: [1],
            Timestamp: expect.any(Date),
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'test-group-name', Value: 'test-group' },
            ],
          },
        ]),
      })
    )

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          {
            MetricName: 'Executions',
            Unit: 'Count',
            Values: [1],
            Counts: [1],
            Timestamp: expect.any(Date),
            Dimensions: [{ Name: 'DeploymentId', Value: 'test-deployment' }],
          },
        ]),
      })
    )
  })

  test('contains default and group dimensions for multiple groups', async () => {
    mockGetMetrics.mockReturnValue({
      metrics: [
        {
          metricName: 'Executions',
          unit: 'count',
          dimensions: [
            { name: 'first-group-name', value: 'first-group' },
            { name: 'second-group-name', value: 'second-group' },
          ],
          timestamp: 0,
          values: [1],
          counts: [1],
        },
      ],
    })

    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    await monitoring.publish()

    expect(
      ((mocked(CloudWatch.prototype.putMetricData).mock
        .calls[0][0] as unknown) as PutMetricDataInput).MetricData
    ).toHaveLength(3)

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'first-group-name', Value: 'first-group' },
              { Name: 'second-group-name', Value: 'second-group' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'first-group-name', Value: 'first-group' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [{ Name: 'DeploymentId', Value: 'test-deployment' }],
          }),
        ]),
      })
    )
  })
})

describe('time and timeEnd', () => {
  test.skip('sends correct metrics base data', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    monitoring.time('test-label', 1000)
    monitoring.timeEnd('test-label', 2000)

    await monitoring.publish()

    expect(CloudWatch.prototype.putMetricData).toBeCalledTimes(1)

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith({
      Namespace: 'ResolveJs',
      MetricData: expect.any(Array),
    })

    const metricData = ((mocked(CloudWatch.prototype.putMetricData).mock
      .calls[0][0] as unknown) as PutMetricDataInput).MetricData

    for (const item of metricData) {
      expect(item).toEqual({
        MetricName: 'Duration',
        Unit: 'Milliseconds',
        Values: [1000],
        Counts: [1],
        Timestamp: expect.any(Date),
        Dimensions: expect.any(Array),
      })
    }
  })

  test.skip('contains default dimensions', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    monitoring.time('test-label', 1000)
    monitoring.timeEnd('test-label', 2000)

    await monitoring.publish()

    expect(
      ((mocked(CloudWatch.prototype.putMetricData).mock
        .calls[0][0] as unknown) as PutMetricDataInput).MetricData
    ).toHaveLength(3)

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'Label', Value: 'test-label' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'ResolveVersion', Value: '1.0.0-test' },
              { Name: 'Label', Value: 'test-label' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'ResolveVersion', Value: '1.0.0-test' },
              { Name: 'Label', Value: 'test-label' },
            ],
          }),
        ]),
      })
    )
  })

  test.skip('contains default and group dimensions', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    const monitoringGroup = monitoring.group({
      'test-group': 'test-group-name',
    })

    monitoringGroup.time('test-label', 1000)
    monitoringGroup.timeEnd('test-label', 2000)

    await monitoring.publish()

    expect(
      ((mocked(CloudWatch.prototype.putMetricData).mock
        .calls[0][0] as unknown) as PutMetricDataInput).MetricData
    ).toHaveLength(3)

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'test-group', Value: 'test-group-name' },
              { Name: 'Label', Value: 'test-label' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'ResolveVersion', Value: '1.0.0-test' },
              { Name: 'test-group', Value: 'test-group-name' },
              { Name: 'Label', Value: 'test-label' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'ResolveVersion', Value: '1.0.0-test' },
              { Name: 'test-group', Value: 'test-group-name' },
              { Name: 'Label', Value: 'test-label' },
            ],
          }),
        ]),
      })
    )
  })

  test.skip('sends correct duration metrics with specified timestamps', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    monitoring.time('test-label', 3000)
    monitoring.timeEnd('test-label', 5000)

    await monitoring.publish()

    const metricData = ((mocked(CloudWatch.prototype.putMetricData).mock
      .calls[0][0] as unknown) as PutMetricDataInput).MetricData

    for (const item of metricData) {
      expect(item).toEqual({
        MetricName: 'Duration',
        Unit: 'Milliseconds',
        Values: [2000],
        Counts: [1],
        Timestamp: expect.any(Date),
        Dimensions: expect.any(Array),
      })
    }
  })

  test.skip('sends correct duration metrics using Date.now', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    mocked(Date.now).mockReturnValueOnce(15000).mockReturnValueOnce(19500)

    monitoring.time('test-label')
    monitoring.timeEnd('test-label')

    await monitoring.publish()

    const metricData = ((mocked(CloudWatch.prototype.putMetricData).mock
      .calls[0][0] as unknown) as PutMetricDataInput).MetricData

    for (const item of metricData) {
      expect(item).toEqual({
        MetricName: 'Duration',
        Unit: 'Milliseconds',
        Values: [4500],
        Counts: [1],
        Timestamp: expect.any(Date),
        Dimensions: expect.any(Array),
      })
    }
  })

  test.skip('sends correct metrics with multiple labels', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    monitoring.time('test-label-1', 1000)
    monitoring.timeEnd('test-label-1', 2000)

    monitoring.time('test-label-2', 1000)
    monitoring.timeEnd('test-label-2', 2000)

    await monitoring.publish()

    expect(
      ((mocked(CloudWatch.prototype.putMetricData).mock
        .calls[0][0] as unknown) as PutMetricDataInput).MetricData
    ).toHaveLength(6)

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'Label', Value: 'test-label-1' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'Label', Value: 'test-label-2' },
            ],
          }),
        ]),
      })
    )
  })
})

describe('Duration', () => {
  test('sends correct metrics base data', async () => {
    mockGetMetrics.mockReturnValue({
      metrics: [
        {
          metricName: 'Duration',
          unit: 'milliseconds',
          dimensions: [
            { name: 'DeploymentId', value: 'test-deployment' },
            { name: 'Label', value: 'test-label' },
          ],
          timestamp: 0,
          values: [1000],
          counts: [1],
        },
      ],
    })

    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    await monitoring.publish()

    expect(CloudWatch.prototype.putMetricData).toBeCalledTimes(1)

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith({
      Namespace: 'ResolveJs',
      MetricData: expect.any(Array),
    })

    const metricData = ((mocked(CloudWatch.prototype.putMetricData).mock
      .calls[0][0] as unknown) as PutMetricDataInput).MetricData

    for (const item of metricData) {
      expect(item).toEqual({
        MetricName: 'Duration',
        Unit: 'Milliseconds',
        Values: [1000],
        Counts: [1],
        Timestamp: expect.any(Date),
        Dimensions: expect.any(Array),
      })
    }
  })

  test('contains default dimensions', async () => {
    mockGetMetrics.mockReturnValue({
      metrics: [
        {
          metricName: 'Duration',
          unit: 'milliseconds',
          dimensions: [
            { name: 'Label', value: 'test-label' },
          ],
          timestamp: 0,
          values: [1000],
          counts: [1],
        },
      ],
    })

    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    await monitoring.publish()

    expect(
      ((mocked(CloudWatch.prototype.putMetricData).mock
        .calls[0][0] as unknown) as PutMetricDataInput).MetricData
    ).toHaveLength(3)

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'Label', Value: 'test-label' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'ResolveVersion', Value: '1.0.0-test' },
              { Name: 'Label', Value: 'test-label' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'ResolveVersion', Value: '1.0.0-test' },
              { Name: 'Label', Value: 'test-label' },
            ],
          }),
        ]),
      })
    )
  })

  test('contains default and group dimensions', async () => {
    mockGetMetrics.mockReturnValue({
      metrics: [
        {
          metricName: 'Duration',
          unit: 'milliseconds',
          dimensions: [
            { name: 'test-group', value: 'test-group-name' },
            { name: 'Label', value: 'test-label' },
          ],
          timestamp: 0,
          values: [1000],
          counts: [1],
        },
      ],
    })

    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    await monitoring.publish()

    expect(
      ((mocked(CloudWatch.prototype.putMetricData).mock
        .calls[0][0] as unknown) as PutMetricDataInput).MetricData
    ).toHaveLength(3)

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'test-group', Value: 'test-group-name' },
              { Name: 'Label', Value: 'test-label' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'ResolveVersion', Value: '1.0.0-test' },
              { Name: 'test-group', Value: 'test-group-name' },
              { Name: 'Label', Value: 'test-label' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'ResolveVersion', Value: '1.0.0-test' },
              { Name: 'test-group', Value: 'test-group-name' },
              { Name: 'Label', Value: 'test-label' },
            ],
          }),
        ]),
      })
    )
  })

  test('publishes different values with same dimensions up to 150 samples', async () => {
    mockGetMetrics.mockReturnValue({
      metrics: [
        {
          metricName: 'Duration',
          unit: 'milliseconds',
          dimensions: [
            { name: 'DeploymentId', value: 'test-deployment' },
            { name: 'ResolveVersion', value: '1.0.0-test' },
            { name: 'test-group', value: 'test-group-name' },
            { name: 'Label', value: 'test-label' },
          ],
          timestamp: 0,
          values: Array.from({ length: 400 }, (_, i) => i + 1),
          counts: Array.from({ length: 400 }).fill(1),
        },
      ],
    })

    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    await monitoring.publish()

    expect(
      ((mocked(CloudWatch.prototype.putMetricData).mock
        .calls[0][0] as unknown) as PutMetricDataInput).MetricData
    ).toHaveLength(9)

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Values: Array.from({ length: 150 }, (_, i) => i + 1),
            Counts: Array.from({ length: 150 }, () => 1),
          }),
        ]),
      })
    )

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Values: Array.from({ length: 150 }, (_, i) => i + 151),
            Counts: Array.from({ length: 150 }, () => 1),
          }),
        ]),
      })
    )

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Values: Array.from({ length: 100 }, (_, i) => i + 301),
            Counts: Array.from({ length: 100 }, () => 1),
          }),
        ]),
      })
    )
  })
})

describe('rate', () => {
  test.skip('sends correct metrics base data', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    monitoring.rate('applied-events', 123)

    await monitoring.publish()

    expect(CloudWatch.prototype.putMetricData).toBeCalledTimes(1)

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith({
      Namespace: 'ResolveJs',
      MetricData: expect.any(Array),
    })

    const metricData = ((mocked(CloudWatch.prototype.putMetricData).mock
      .calls[0][0] as unknown) as PutMetricDataInput).MetricData

    for (const item of metricData) {
      expect(item).toEqual({
        MetricName: 'applied-events',
        Unit: 'Count/Second',
        Values: [123],
        Counts: [1],
        Timestamp: expect.any(Date),
        Dimensions: expect.any(Array),
      })
    }
  })

  test.skip('sends correct metrics base data if seconds are specified', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    monitoring.rate('applied-events', 15, 0.5)

    await monitoring.publish()

    expect(CloudWatch.prototype.putMetricData).toBeCalledTimes(1)

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith({
      Namespace: 'ResolveJs',
      MetricData: expect.any(Array),
    })

    const metricData = ((mocked(CloudWatch.prototype.putMetricData).mock
      .calls[0][0] as unknown) as PutMetricDataInput).MetricData

    for (const item of metricData) {
      expect(item).toEqual({
        MetricName: 'applied-events',
        Unit: 'Count/Second',
        Values: [30],
        Counts: [1],
        Timestamp: expect.any(Date),
        Dimensions: expect.any(Array),
      })
    }
  })

  test.skip('contains default dimensions', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    monitoring.rate('applied-events', 123)

    await monitoring.publish()

    expect(
      ((mocked(CloudWatch.prototype.putMetricData).mock
        .calls[0][0] as unknown) as PutMetricDataInput).MetricData
    ).toHaveLength(3)

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [{ Name: 'DeploymentId', Value: 'test-deployment' }],
          }),
        ]),
      })
    )

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [{ Name: 'ResolveVersion', Value: '1.0.0-test' }],
          }),
        ]),
      })
    )

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'ResolveVersion', Value: '1.0.0-test' },
            ],
          }),
        ]),
      })
    )
  })

  test.skip('contains default and group dimensions', async () => {
    const monitoring = createMonitoring({
      deploymentId: 'test-deployment',
      resolveVersion: '1.0.0-test',
    })

    const monitoringGroup = monitoring.group({
      'test-group': 'test-group-name',
    })

    monitoringGroup.rate('applied-events', 1000)

    await monitoring.publish()

    expect(
      ((mocked(CloudWatch.prototype.putMetricData).mock
        .calls[0][0] as unknown) as PutMetricDataInput).MetricData
    ).toHaveLength(3)

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'test-group', Value: 'test-group-name' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'ResolveVersion', Value: '1.0.0-test' },
              { Name: 'test-group', Value: 'test-group-name' },
            ],
          }),
        ]),
      })
    )

    expect(CloudWatch.prototype.putMetricData).toBeCalledWith(
      expect.objectContaining({
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            Dimensions: [
              { Name: 'DeploymentId', Value: 'test-deployment' },
              { Name: 'ResolveVersion', Value: '1.0.0-test' },
              { Name: 'test-group', Value: 'test-group-name' },
            ],
          }),
        ]),
      })
    )
  })
})
