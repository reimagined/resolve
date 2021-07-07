import { Client } from '@resolve-js/client'
import { CloudWatch } from '@aws-sdk/client-cloudwatch'
import { getClient } from '../utils/utils'
import { isEqual } from 'lodash'
import { customAlphabet } from 'nanoid'

type BaseMetrics = {
  Errors: {
    commandPart: number
    command: {
      failCommandA: number
      failCommandB: number
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

const createDimensions = (list: string[]): Dimension[] =>
  list.map((item) => {
    const temp = item.split('=')

    return {
      Name: temp[0],
      Value: temp[1],
    }
  })

const collectBaseMetrics = async (): Promise<BaseMetrics> => {
  const [
    commandPartMetrics,
    failCommandAMetrics,
    failCommandBMetrics,
    resolverAMetrics,
    resolverBMetrics,
  ] = await Promise.all([
    getMetricData({
      MetricName: 'Errors',
      Stat: 'Sum',
      Unit: 'Count',
      Dimensions: createDimensions([
        `DeploymentId=${deploymentId}`,
        'Part=Command',
      ]),
    }),
    getMetricData({
      MetricName: 'Errors',
      Stat: 'Sum',
      Unit: 'Count',
      Dimensions: createDimensions([
        `DeploymentId=${deploymentId}`,
        'Part=Command',
        'AggregateName=monitoring-aggregate',
        'Type=failCommandA',
      ]),
    }),
    getMetricData({
      MetricName: 'Errors',
      Stat: 'Sum',
      Unit: 'Count',
      Dimensions: createDimensions([
        `DeploymentId=${deploymentId}`,
        'Part=Command',
        'AggregateName=monitoring-aggregate',
        'Type=failCommandB',
      ]),
    }),
    getMetricData({
      MetricName: 'Errors',
      Stat: 'Sum',
      Unit: 'Count',
      Dimensions: createDimensions([
        `DeploymentId=${deploymentId}`,
        'Part=ReadModelResolver',
        'ReadModel=monitoring',
        'Resolver=resolverA',
      ]),
    }),
    getMetricData({
      MetricName: 'Errors',
      Stat: 'Sum',
      Unit: 'Count',
      Dimensions: createDimensions([
        `DeploymentId=${deploymentId}`,
        'Part=ReadModelResolver',
        'ReadModel=monitoring',
        'Resolver=resolverB',
      ]),
    }),
  ])

  return {
    Errors: {
      commandPart: commandPartMetrics,
      command: {
        failCommandA: failCommandAMetrics,
        failCommandB: failCommandBMetrics,
      },
      readModelResolver: {
        resolverA: resolverAMetrics,
        resolverB: resolverBMetrics,
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
      const lastDimension =
        metricData.Dimensions[metricData.Dimensions.length - 1]
      const dimensionString = `${lastDimension.Name}=${lastDimension.Value}`

      throw Error(
        [
          `Metric data mismatch after ${attempt} attempts: `,
          `expected ${value}, received last ${metric} `,
          `(last dimension: ${dimensionString})`,
        ].join('')
      )
    }
    await new Promise((resolve) => setTimeout(resolve, attemptPeriod))

    await awaitMetricValue(metricData, value, attempt + 1)
  }
}

describe('Commands', () => {
  test('aggregate commands failed', async () => {
    await expect(
      client.command({
        aggregateId: 'any',
        aggregateName: 'monitoring-aggregate',
        type: 'failCommandA',
        payload: {},
      })
    ).rejects.toThrowError()

    await expect(
      client.command({
        aggregateId: 'any',
        aggregateName: 'monitoring-aggregate',
        type: 'failCommandB',
        payload: {},
      })
    ).rejects.toThrowError()

    baseMetrics.Errors.command.failCommandA += 1
    baseMetrics.Errors.command.failCommandB += 1
    baseMetrics.Errors.commandPart += 2

    await awaitMetricValue(
      {
        MetricName: 'Errors',
        Stat: 'Sum',
        Unit: 'Count',
        Dimensions: createDimensions([
          `DeploymentId=${deploymentId}`,
          'Part=Command',
          'AggregateName=monitoring-aggregate',
          'Type=failCommandA',
        ]),
      },
      baseMetrics.Errors.command.failCommandA
    )

    await awaitMetricValue(
      {
        MetricName: 'Errors',
        Stat: 'Sum',
        Unit: 'Count',
        Dimensions: createDimensions([
          `DeploymentId=${deploymentId}`,
          'Part=Command',
          'AggregateName=monitoring-aggregate',
          'Type=failCommandB',
        ]),
      },
      baseMetrics.Errors.command.failCommandB
    )

    await awaitMetricValue(
      {
        MetricName: 'Errors',
        Stat: 'Sum',
        Unit: 'Count',
        Dimensions: createDimensions([
          `DeploymentId=${deploymentId}`,
          'Part=Command',
          'AggregateName=monitoring-aggregate',
        ]),
      },
      baseMetrics.Errors.command.failCommandA +
        baseMetrics.Errors.command.failCommandB
    )

    await awaitMetricValue(
      {
        MetricName: 'Errors',
        Stat: 'Sum',
        Unit: 'Count',
        Dimensions: createDimensions([
          `DeploymentId=${deploymentId}`,
          'Part=Command',
          'AggregateName=monitoring-aggregate',
        ]),
      },
      baseMetrics.Errors.command.failCommandA +
        baseMetrics.Errors.command.failCommandB
    )

    await awaitMetricValue(
      {
        MetricName: 'Errors',
        Stat: 'Sum',
        Unit: 'Count',
        Dimensions: createDimensions([
          `DeploymentId=${deploymentId}`,
          'Part=Command',
        ]),
      },
      baseMetrics.Errors.commandPart
    )
  })
})

describe('Read Model Projection monitoring', () => {
  test('read model Init handler failed', async () => {
    await awaitMetricValue(
      {
        MetricName: 'Errors',
        Stat: 'Sum',
        Unit: 'Count',
        Dimensions: createDimensions([
          `DeploymentId=${deploymentId}`,
          'Part=ReadModelProjection',
          'ReadModel=init-failed',
          'EventType=Init',
        ]),
      },
      1
    )
  })

  test('read model event handler failed', async () => {
    await client.command({
      aggregateId: 'any',
      aggregateName: 'monitoring-aggregate',
      type: 'failReadModelProjection',
      payload: {},
    })

    await awaitMetricValue(
      {
        MetricName: 'Errors',
        Stat: 'Sum',
        Unit: 'Count',
        Dimensions: createDimensions([
          `DeploymentId=${deploymentId}`,
          'Part=ReadModelProjection',
          'ReadModel=monitoring',
          'EventType=MONITORING_FAILED_HANDLER',
        ]),
      },
      1
    )
  })
})

describe('Read Model Resolver monitoring', () => {
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
        Dimensions: createDimensions([
          `DeploymentId=${deploymentId}`,
          'Part=ReadModelResolver',
          'ReadModel=monitoring',
          'Resolver=resolverA',
        ]),
      },
      baseMetrics.Errors.readModelResolver.resolverA
    )

    await awaitMetricValue(
      {
        MetricName: 'Errors',
        Stat: 'Sum',
        Unit: 'Count',
        Dimensions: createDimensions([
          `DeploymentId=${deploymentId}`,
          'Part=ReadModelResolver',
          'ReadModel=monitoring',
        ]),
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
        Dimensions: createDimensions([
          `DeploymentId=${deploymentId}`,
          'Part=ReadModelResolver',
          'ReadModel=monitoring',
          'Resolver=resolverB',
        ]),
      },
      baseMetrics.Errors.readModelResolver.resolverB
    )

    await awaitMetricValue(
      {
        MetricName: 'Errors',
        Stat: 'Sum',
        Unit: 'Count',
        Dimensions: createDimensions([
          `DeploymentId=${deploymentId}`,
          'Part=ReadModelResolver',
          'ReadModel=monitoring',
        ]),
      },
      baseMetrics.Errors.readModelResolver.resolverB +
        baseMetrics.Errors.readModelResolver.resolverA
    )
  })
})
