import { Client } from '@resolve-js/client'
import { CloudWatch } from '@aws-sdk/client-cloudwatch'
import { getClient } from '../utils/utils'
import { isEqual } from 'lodash'

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
        Id: 'query',
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
        Value: 'init-failed',
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
        Value: 'init-failed',
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
  cw = new CloudWatch({})
  client = getClient()
  endTime = new Date(Date.now() + 3600000)
  startTime = new Date(Date.now() - 360000 * 24)
  baseMetrics = await collectBaseMetrics()
})

const maxAttempts = 5
const attemptPeriod = 5000

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

// eslint-disable-next-line spellcheck/spell-checker
const deploymentId = process.env.RESOLVE_TESTS_TARGET_DEPLOYMENT_ID

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
    1
  )
})
