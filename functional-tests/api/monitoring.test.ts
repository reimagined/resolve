import { Client } from '@resolve-js/client'
import { CloudWatch } from '@aws-sdk/client-cloudwatch'
import { getClient } from '../utils/utils'
import { isEqual } from 'lodash'
import { customAlphabet } from 'nanoid'

type BaseMetrics = {
  Errors: {
    readModelProjection: {
      Init: number
      EventHandler: number
    }
    readModelResolver: {
      resolverA: number
      resolverB: number
    }
  }
}

interface Dimension {
  Name: string
  Value: string
}

const nanoid = customAlphabet('0123456789abcdef_', 16)
const maxAttempts = 5
const attemptPeriod = 2000

// eslint-disable-next-line spellcheck/spell-checker
let deploymentId: string
let cw: CloudWatch
let client: Client
let startTime: Date
let endTime: Date
let baseMetrics: BaseMetrics

const getMetricData = async ({
  MetricName,
  Stat,
  Unit,
  Dimensions,
}: {
  MetricName: string
  Stat: string
  Unit: string
  Dimensions: Array<Dimension>
}): Promise<number> => {
  const data = await cw.getMetricData({
    MetricDataQueries: [
      {
        Id: `q${nanoid()}`,
        MetricStat: {
          Metric: {
            Namespace: 'ResolveJs',
            MetricName,
            Dimensions,
          },
          Stat,
          Period: 31536000, // year
          Unit,
        },
      },
    ],
    StartTime: startTime,
    EndTime: endTime,
  })
  const valueCount = data.MetricDataResults?.[0]?.Values?.length ?? 0

  if (valueCount === 0) {
    return 0
  }
  if (valueCount === 1) {
    return data.MetricDataResults?.[0]?.Values?.[0] as number
  }
  throw Error(`multiple metric ${MetricName} values received`)
}

const collectBaseMetrics = async (): Promise<BaseMetrics> => {
  const metrics = await Promise.all([
    getMetricData({
      MetricName: 'Errors',
      Stat: 'Sum',
      Unit: 'Count',
      Dimensions: [
        {
          Name: 'DeploymentId',
          Value: deploymentId,
        },
        {
          Name: 'Part',
          Value: 'ReadModelProjection',
        },
        {
          Name: 'ReadModel',
          Value: 'init-failed',
        },
        {
          Name: 'EventType',
          Value: 'Init',
        },
      ],
    }),
    getMetricData({
      MetricName: 'Errors',
      Stat: 'Sum',
      Unit: 'Count',
      Dimensions: [
        {
          Name: 'DeploymentId',
          Value: deploymentId,
        },
        {
          Name: 'Part',
          Value: 'ReadModelProjection',
        },
        {
          Name: 'ReadModel',
          Value: 'monitoring',
        },
        {
          Name: 'EventType',
          Value: 'MONITORING_FAILED_HANDLER',
        },
      ],
    }),
    getMetricData({
      MetricName: 'Errors',
      Stat: 'Sum',
      Unit: 'Count',
      Dimensions: [
        {
          Name: 'DeploymentId',
          Value: deploymentId,
        },
        {
          Name: 'Part',
          Value: 'ReadModelResolver',
        },
        {
          Name: 'ReadModel',
          Value: 'monitoring',
        },
        {
          Name: 'Resolver',
          Value: 'resolverA',
        },
      ],
    }),
    getMetricData({
      MetricName: 'Errors',
      Stat: 'Sum',
      Unit: 'Count',
      Dimensions: [
        {
          Name: 'DeploymentId',
          Value: deploymentId,
        },
        {
          Name: 'Part',
          Value: 'ReadModelResolver',
        },
        {
          Name: 'ReadModel',
          Value: 'monitoring',
        },
        {
          Name: 'Resolver',
          Value: 'resolverB',
        },
      ],
    }),
  ])

  return {
    Errors: {
      readModelProjection: {
        Init: metrics[0],
        EventHandler: metrics[1],
      },
      readModelResolver: {
        resolverA: metrics[2],
        resolverB: metrics[3],
      },
    },
  }
}

beforeAll(async () => {
  deploymentId = process.env.RESOLVE_TESTS_TARGET_DEPLOYMENT_ID || ''
  cw = new CloudWatch({})
  client = getClient()
  endTime = new Date(Date.now() + 3600000) // next hour
  startTime = new Date(Date.now() - 3600000 * 24) // previous day
  baseMetrics = await collectBaseMetrics()
})

const awaitMetricValue = async (
  metricData: {
    MetricName: string
    Stat: string
    Unit: string
    Dimensions: Array<Dimension>
  },
  value: number,
  attempt = 0
): Promise<any> => {
  const metric = await getMetricData(metricData)

  if (!isEqual(metric, value)) {
    if (attempt >= maxAttempts) {
      throw Error(
        `Metric data mismatch after ${attempt} attempts: expected ${value}, received last ${metric}`
      )
    }
    await new Promise((resolve) => setTimeout(resolve, attemptPeriod))

    await awaitMetricValue(metricData, value, attempt + 1)
  }
}

describe('Read Model', () => {
  test('read model Init handler failed', async () => {
    await awaitMetricValue(
      {
        MetricName: 'Errors',
        Stat: 'Sum',
        Unit: 'Count',
        Dimensions: [
          {
            Name: 'DeploymentId',
            Value: deploymentId,
          },
          {
            Name: 'Part',
            Value: 'ReadModelProjection',
          },
          {
            Name: 'ReadModel',
            Value: 'init-failed',
          },
          {
            Name: 'EventType',
            Value: 'Init',
          },
        ],
      },
      baseMetrics.Errors.readModelProjection.Init
    )
  })

  test('read model resolverA failed', async () => {
    await expect(
      client.query({
        name: 'monitoring',
        resolver: 'resolverA',
        args: {},
      })
    ).rejects.toBeInstanceOf(Error)

    baseMetrics.Errors.readModelResolver.resolverA++

    await awaitMetricValue(
      {
        MetricName: 'Errors',
        Stat: 'Sum',
        Unit: 'Count',
        Dimensions: [
          {
            Name: 'DeploymentId',
            Value: deploymentId,
          },
          {
            Name: 'Part',
            Value: 'ReadModelResolver',
          },
          {
            Name: 'ReadModel',
            Value: 'monitoring',
          },
          {
            Name: 'Resolver',
            Value: 'resolverA',
          },
        ],
      },
      baseMetrics.Errors.readModelResolver.resolverA
    )

    await awaitMetricValue(
      {
        MetricName: 'Errors',
        Stat: 'Sum',
        Unit: 'Count',
        Dimensions: [
          {
            Name: 'DeploymentId',
            Value: deploymentId,
          },
          {
            Name: 'Part',
            Value: 'ReadModelResolver',
          },
          {
            Name: 'ReadModel',
            Value: 'monitoring',
          },
        ],
      },
      baseMetrics.Errors.readModelResolver.resolverB +
        baseMetrics.Errors.readModelResolver.resolverA
    )
  })

  test('read model resolverB failed', async () => {
    await expect(
      client.query({
        name: 'monitoring',
        resolver: 'resolverB',
        args: {},
      })
    ).rejects.toBeInstanceOf(Error)

    baseMetrics.Errors.readModelResolver.resolverB++

    await awaitMetricValue(
      {
        MetricName: 'Errors',
        Stat: 'Sum',
        Unit: 'Count',
        Dimensions: [
          {
            Name: 'DeploymentId',
            Value: deploymentId,
          },
          {
            Name: 'Part',
            Value: 'ReadModelResolver',
          },
          {
            Name: 'ReadModel',
            Value: 'monitoring',
          },
          {
            Name: 'Resolver',
            Value: 'resolverB',
          },
        ],
      },
      baseMetrics.Errors.readModelResolver.resolverB
    )

    await awaitMetricValue(
      {
        MetricName: 'Errors',
        Stat: 'Sum',
        Unit: 'Count',
        Dimensions: [
          {
            Name: 'Part',
            Value: 'ReadModelResolver',
          },
          {
            Name: 'ReadModel',
            Value: 'monitoring',
          },
        ],
      },
      baseMetrics.Errors.readModelResolver.resolverB +
        baseMetrics.Errors.readModelResolver.resolverA
    )
  })

  test('read model event handler failed', async () => {
    await client.command({
      aggregateId: 'any',
      aggregateName: 'monitoring-aggregate',
      type: 'fail',
      payload: {},
    })

    baseMetrics.Errors.readModelProjection.EventHandler++

    await awaitMetricValue(
      {
        MetricName: 'Errors',
        Stat: 'Sum',
        Unit: 'Count',
        Dimensions: [
          {
            Name: 'Part',
            Value: 'ReadModelProjection',
          },
          {
            Name: 'ReadModel',
            Value: 'monitoring',
          },
          {
            Name: 'EventType',
            Value: 'MONITORING_FAILED_HANDLER',
          },
        ],
      },
      baseMetrics.Errors.readModelProjection.EventHandler
    )
  })
})
