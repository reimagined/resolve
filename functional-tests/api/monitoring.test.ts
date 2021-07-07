import { Client } from '@resolve-js/client'
import { CloudWatch } from '@aws-sdk/client-cloudwatch'
import { getClient } from '../utils/utils'
import { isEqual } from 'lodash'
import { customAlphabet } from 'nanoid'

type BaseMetrics = {
  Errors: {
    commandPart: number
    command: {
      failCommand: number
    }
    readModelResolver: {
      resolver: number
      resolverB: number
    }
  }
  Executions: {
    commandPart: number
    command: {
      failCommand: number
    }
  }
}

interface CommandBaseMetrics {
  partErrors: number
  commandErrors: number
  partExecutions: number
  commandExecutions: number
  executionDurationSamples: number
}

type ReadModelResolverBaseMetrics = {
  partErrors: number
  resolverErrors: number
  resolverBErrors: number
  partExecutions: number
  resolverExecutions: number
  executionDurationSamples: number
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
let commandBaseMetrics: CommandBaseMetrics
let readModelResolverBaseMetrics: ReadModelResolverBaseMetrics

const getMetricData = async ({
  MetricName,
  Stat,
  Dimensions,
}: {
  MetricName: string
  Stat: string
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
    failCommandMetrics,
    resolverMetrics,
    resolverBMetrics,
  ] = await Promise.all([
    getMetricData({
      MetricName: 'Errors',
      Stat: 'Sum',
      Dimensions: createDimensions([
        `DeploymentId=${deploymentId}`,
        'Part=Command',
      ]),
    }),
    getMetricData({
      MetricName: 'Errors',
      Stat: 'Sum',
      Dimensions: createDimensions([
        `DeploymentId=${deploymentId}`,
        'Part=Command',
        'AggregateName=monitoring-aggregate',
        'Type=failCommand',
      ]),
    }),
    getMetricData({
      MetricName: 'Errors',
      Stat: 'Sum',
      Dimensions: createDimensions([
        `DeploymentId=${deploymentId}`,
        'Part=ReadModelResolver',
        'ReadModel=monitoring',
        'Resolver=resolver',
      ]),
    }),
    getMetricData({
      MetricName: 'Errors',
      Stat: 'Sum',
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
        failCommand: failCommandMetrics,
      },
      readModelResolver: {
        resolver: resolverMetrics,
        resolverB: resolverBMetrics,
      },
    },
    Executions: {
      commandPart: 0,
      command: {
        failCommand: 0,
      },
    },
  }
}

const collectBaseCommandMetrics = async (): Promise<CommandBaseMetrics> => {
  const [
    partErrors,
    commandErrors,
    partExecutions,
    commandExecutions,
    executionDurationSamples,
  ] = await Promise.all([
    getMetricData({
      MetricName: 'Errors',
      Stat: 'Sum',
      Dimensions: createDimensions([
        `DeploymentId=${deploymentId}`,
        'Part=Command',
      ]),
    }),
    getMetricData({
      MetricName: 'Errors',
      Stat: 'Sum',
      Dimensions: createDimensions([
        `DeploymentId=${deploymentId}`,
        'Part=Command',
        'AggregateName=monitoring-aggregate',
        'Type=failCommand',
      ]),
    }),
    getMetricData({
      MetricName: 'Executions',
      Stat: 'Sum',
      Dimensions: createDimensions([
        `DeploymentId=${deploymentId}`,
        'Part=Command',
      ]),
    }),
    getMetricData({
      MetricName: 'Executions',
      Stat: 'Sum',
      Dimensions: createDimensions([
        `DeploymentId=${deploymentId}`,
        'Part=Command',
        'AggregateName=monitoring-aggregate',
        'Type=failCommand',
      ]),
    }),
    getMetricData({
      MetricName: 'Duration',
      Stat: 'SampleCount',
      Dimensions: createDimensions([
        `DeploymentId=${deploymentId}`,
        'Part=Command',
        'AggregateName=monitoring-aggregate',
        'Type=failCommand',
        'Label=Execution',
      ]),
    }),
  ])

  return {
    partErrors,
    commandErrors,
    partExecutions,
    commandExecutions,
    executionDurationSamples,
  }
}

const collectReadModelResolverBaseMetrics = async (): Promise<ReadModelResolverBaseMetrics> => {
  const [
    partErrors,
    resolverErrors,
    partExecutions,
    resolverExecutions,
    executionDurationSamples,
  ] = await Promise.all([
    getMetricData({
      MetricName: 'Errors',
      Stat: 'Sum',
      Dimensions: createDimensions([
        `DeploymentId=${deploymentId}`,
        'Part=ReadModelResolver',
      ]),
    }),
    getMetricData({
      MetricName: 'Errors',
      Stat: 'Sum',
      Dimensions: createDimensions([
        `DeploymentId=${deploymentId}`,
        'Part=ReadModelResolver',
        'ReadModel=monitoring',
        'Resolver=failResolver',
      ]),
    }),
    getMetricData({
      MetricName: 'Executions',
      Stat: 'Sum',
      Dimensions: createDimensions([
        `DeploymentId=${deploymentId}`,
        'Part=ReadModelResolver',
      ]),
    }),
    getMetricData({
      MetricName: 'Executions',
      Stat: 'Sum',
      Dimensions: createDimensions([
        `DeploymentId=${deploymentId}`,
        'Part=ReadModelResolver',
        'ReadModel=monitoring',
        'Resolver=failResolver',
      ]),
    }),
    getMetricData({
      MetricName: 'Duration',
      Stat: 'SampleCount',
      Dimensions: createDimensions([
        `DeploymentId=${deploymentId}`,
        'Part=ReadModelResolver',
        'ReadModel=monitoring',
        'Resolver=failResolver',
        'Label=Execution',
      ]),
    }),
  ])

  return {
    partErrors,
    resolverErrors,
    resolverBErrors: 0,
    partExecutions,
    resolverExecutions,
    executionDurationSamples,
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
  beforeAll(async () => {
    commandBaseMetrics = await collectBaseCommandMetrics()
  })

  test('aggregate command failed', async () => {
    await expect(
      client.command({
        aggregateId: 'any',
        aggregateName: 'monitoring-aggregate',
        type: 'failCommand',
        payload: {},
      })
    ).rejects.toThrowError()

    commandBaseMetrics.commandErrors++
    commandBaseMetrics.partErrors++
    commandBaseMetrics.commandExecutions++
    commandBaseMetrics.partExecutions++
    commandBaseMetrics.executionDurationSamples++

    await awaitMetricValue(
      {
        MetricName: 'Errors',
        Stat: 'Sum',
        Dimensions: createDimensions([
          `DeploymentId=${deploymentId}`,
          'Part=Command',
          'AggregateName=monitoring-aggregate',
          'Type=failCommand',
        ]),
      },
      commandBaseMetrics.commandErrors
    )

    await awaitMetricValue(
      {
        MetricName: 'Errors',
        Stat: 'Sum',
        Dimensions: createDimensions([
          `DeploymentId=${deploymentId}`,
          'Part=Command',
        ]),
      },
      commandBaseMetrics.partErrors
    )

    await awaitMetricValue(
      {
        MetricName: 'Executions',
        Stat: 'Sum',
        Dimensions: createDimensions([
          `DeploymentId=${deploymentId}`,
          'Part=Command',
          'AggregateName=monitoring-aggregate',
          'Type=failCommand',
        ]),
      },
      commandBaseMetrics.commandExecutions
    )

    await awaitMetricValue(
      {
        MetricName: 'Executions',
        Stat: 'Sum',
        Dimensions: createDimensions([
          `DeploymentId=${deploymentId}`,
          'Part=Command',
        ]),
      },
      commandBaseMetrics.partExecutions
    )

    await awaitMetricValue(
      {
        MetricName: 'Duration',
        Stat: 'SampleCount',
        Dimensions: createDimensions([
          `DeploymentId=${deploymentId}`,
          'Part=Command',
          'AggregateName=monitoring-aggregate',
          'Type=failCommand',
          'Label=Execution',
        ]),
      },
      commandBaseMetrics.executionDurationSamples
    )
  })
})

describe('Read Model Projection monitoring', () => {
  test('read model Init handler failed', async () => {
    await awaitMetricValue(
      {
        MetricName: 'Errors',
        Stat: 'Sum',
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
  beforeAll(async () => {
    readModelResolverBaseMetrics = await collectReadModelResolverBaseMetrics()
  })

  test('read model resolver failed', async () => {
    await expect(
      client.query({
        name: 'monitoring',
        resolver: 'failResolver',
        args: {},
      })
    ).rejects.toBeInstanceOf(Error)

    readModelResolverBaseMetrics.resolverErrors++
    readModelResolverBaseMetrics.partErrors++
    readModelResolverBaseMetrics.resolverExecutions++
    readModelResolverBaseMetrics.partExecutions++
    readModelResolverBaseMetrics.executionDurationSamples++

    await awaitMetricValue(
      {
        MetricName: 'Errors',
        Stat: 'Sum',
        Dimensions: createDimensions([
          `DeploymentId=${deploymentId}`,
          'Part=ReadModelResolver',
          'ReadModel=monitoring',
          'Resolver=failResolver',
        ]),
      },
      readModelResolverBaseMetrics.resolverErrors
    )

    await awaitMetricValue(
      {
        MetricName: 'Errors',
        Stat: 'Sum',
        Dimensions: createDimensions([
          `DeploymentId=${deploymentId}`,
          'Part=ReadModelResolver',
        ]),
      },
      readModelResolverBaseMetrics.partErrors
    )

    await awaitMetricValue(
      {
        MetricName: 'Executions',
        Stat: 'Sum',
        Dimensions: createDimensions([
          `DeploymentId=${deploymentId}`,
          'Part=ReadModelResolver',
          'ReadModel=monitoring',
          'Resolver=failResolver',
        ]),
      },
      readModelResolverBaseMetrics.resolverExecutions
    )

    await awaitMetricValue(
      {
        MetricName: 'Executions',
        Stat: 'Sum',
        Dimensions: createDimensions([
          `DeploymentId=${deploymentId}`,
          'Part=ReadModelResolver',
        ]),
      },
      readModelResolverBaseMetrics.partExecutions
    )

    await awaitMetricValue(
      {
        MetricName: 'Duration',
        Stat: 'SampleCount',
        Dimensions: createDimensions([
          `DeploymentId=${deploymentId}`,
          'Part=ReadModelResolver',
          'ReadModel=monitoring',
          'Resolver=failResolver',
          'Label=Execution',
        ]),
      },
      readModelResolverBaseMetrics.executionDurationSamples
    )
  })
})
