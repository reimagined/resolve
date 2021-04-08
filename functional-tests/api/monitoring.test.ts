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

const nanoid = customAlphabet('0123456789abcdef_', 16)
const maxAttempts = 2
const attemptPeriod = 2000

// eslint-disable-next-line spellcheck/spell-checker
let deploymentId: string
let cw: CloudWatch
let client: Client
let startTime: Date
let endTime: Date
let baseMetrics: BaseMetrics

const getMetricData = async (
  part: string,
  ...dimensions: Array<any>
): Promise<number> => {
  const data = await cw.getMetricData({
    MetricDataQueries: [
      {
        Id: `q${nanoid()}`,
        MetricStat: {
          Metric: {
            Namespace: 'RESOLVE_METRICS',
            MetricName: 'Errors',
            Dimensions: [
              {
                Name: 'DeploymentId',
                Value: deploymentId,
              },
              {
                Name: 'Part',
                Value: part,
              },
              ...dimensions,
            ],
          },
          Stat: 'Sum',
          Period: 31536000, // year
          Unit: 'Count',
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
  throw Error(`multiple metric ${part} values received`)
}

const collectBaseMetrics = async (): Promise<BaseMetrics> => {
  const metrics = await Promise.all([
    getMetricData(
      'ReadModelProjection',
      {
        Name: 'ReadModel',
        Value: 'init-failed',
      },
      {
        Name: 'EventType',
        Value: 'Init',
      }
    ),
    getMetricData(
      'ReadModelProjection',
      {
        Name: 'ReadModel',
        Value: 'init-failed',
      },
      {
        Name: 'EventType',
        Value: 'Init',
      }
    ),
    getMetricData(
      'ReadModelResolver',
      {
        Name: 'ReadModel',
        Value: 'monitoring',
      },
      {
        Name: 'Resolver',
        Value: 'resolverA',
      }
    ),
    getMetricData(
      'ReadModelResolver',
      {
        Name: 'ReadModel',
        Value: 'monitoring',
      },
      {
        Name: 'Resolver',
        Value: 'resolverB',
      }
    ),
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
  endTime = new Date(Date.now() + 3600000)
  startTime = new Date(Date.now() - 360000 * 24)
  baseMetrics = await collectBaseMetrics()
})

const awaitMetricValue = async (
  part: string,
  dimensions: Array<any>,
  value: number,
  attempt = 0
): Promise<any> => {
  const metric = await getMetricData(part, dimensions)

  if (!isEqual(metric, value)) {
    if (attempt >= maxAttempts) {
      throw Error(
        `Metric data mismatch after ${attempt} attempts: expected ${value}, received last ${metric}`
      )
    }
    await new Promise((resolve) => setTimeout(resolve, attemptPeriod))
    await awaitMetricValue(part, dimensions, value, attempt + 1)
  }
}

test('read model Init handler failed', async () => {
  await awaitMetricValue(
    'ReadModelProjection',
    [
      {
        Name: 'ReadModel',
        Value: 'init-failed',
      },
      {
        Name: 'EventType',
        Value: 'Init',
      },
    ],
    baseMetrics.Errors.readModelProjection.Init + 1
  )
})

test('read model resolverA failed', async () => {
  /*
  baseMetrics.Errors.readModelResolver.resolverA += 2

  await expect(
    client.query({
      name: 'monitoring',
      resolver: 'resolverA',
      args: {},
    })
  ).rejects.toBeInstanceOf(Error)
  */

  await awaitMetricValue(
    'ReadModelResolver',
    [
      {
        Name: 'ReadModel',
        Value: 'monitoring',
      },
      {
        Name: 'Resolver',
        Value: 'resolverA',
      },
    ],
    baseMetrics.Errors.readModelResolver.resolverA
  )
})

test('read model resolverB failed', async () => {
  /*
  baseMetrics.Errors.readModelResolver.resolverB += 2

  await expect(
    client.query({
      name: 'monitoring',
      resolver: 'resolverB',
      args: {},
    })
  ).rejects.toBeInstanceOf(Error)
  */

  await awaitMetricValue(
    'ReadModelResolver',
    [
      {
        Name: 'ReadModel',
        Value: 'monitoring',
      },
      {
        Name: 'Resolver',
        Value: 'resolverB',
      },
    ],
    baseMetrics.Errors.readModelResolver.resolverB
  )
})

test('read model event handler failed', async () => {
  await client.command({
    aggregateId: 'any',
    aggregateName: 'monitoring-aggregate',
    type: 'fail',
    payload: {},
  })

  await awaitMetricValue(
    'ReadModelProjection',
    [
      {
        Name: 'ReadModel',
        Value: 'monitoring',
      },
      {
        Name: 'EventType',
        Value: 'MONITORING_FAILED_HANDLER',
      },
    ],
    baseMetrics.Errors.readModelProjection.EventHandler + 1
  )
})
