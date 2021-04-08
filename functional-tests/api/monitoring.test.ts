import { Client } from '@resolve-js/client'
import { CloudWatch } from '@aws-sdk/client-cloudwatch'
import { getClient } from '../utils/utils'
import { isEqual } from 'lodash'

let cw: CloudWatch
let client: Client

beforeAll(() => {
  cw = new CloudWatch({})
  client = getClient()
})

const maxAttempts = 5
const attemptPeriod = 5000

const awaitMetricData = async (
  part: string,
  dimensions: Array<any>,
  values: Array<number>,
  attempt = 0
): Promise<any> => {
  const metric = await cw.getMetricData({
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
          Period: 60 * 60 * 60 * 60,
          Unit: 'Count',
        },
      },
    ],
    StartTime: new Date(2021, 2, 29),
    EndTime: new Date(2021, 3, 5),
  })

  if (!isEqual(metric.MetricDataResults?.[0]?.Values, values)) {
    if (attempt >= maxAttempts) {
      throw Error(`Metric data mismatch after ${attempt} attempts`)
    }
    await new Promise((resolve) => setTimeout(resolve, attemptPeriod))
    await awaitMetricData(part, dimensions, values, attempt + 1)
  }
}

// eslint-disable-next-line spellcheck/spell-checker
const deploymentId = process.env.RESOLVE_TESTS_TARGET_DEPLOYMENT_ID

test('read model Init handler failed', async () => {
  await awaitMetricData(
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
    [1]
  )
})
