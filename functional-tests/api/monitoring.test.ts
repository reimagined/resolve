import { Client } from '@resolve-js/client'
import { CloudWatch } from '@aws-sdk/client-cloudwatch'
import { Lambda } from '@aws-sdk/client-lambda'
import { getClient, getTargetURL } from '../utils/utils'
import { isEqual } from 'lodash'
import { customAlphabet } from 'nanoid'
import { parse as parseVersion } from 'semver'

interface CommandBaseMetrics {
  partErrors: number
  commandErrors: number
  partExecutions: number
  commandExecutions: number
  executionDurationSamples: number
}

type ResolverBaseMetrics = {
  partErrors: number
  resolverErrors: number
  partExecutions: number
  resolverExecutions: number
  executionDurationSamples: number
}

type SingleViewModelBaseMetrics = {
  resolverErrors: number
  resolverExecutions: number
  resolverExecutionDurationSamples: number
  projectionErrors: number
}

type ViewModelBaseMetrics = {
  resolverPartErrors: number
  resolverPartExecutions: number
  projectionPartErrors: number

  monitoring: SingleViewModelBaseMetrics
  initFailed: SingleViewModelBaseMetrics
  resolverFailed: SingleViewModelBaseMetrics
}

type ApiHandlerBaseMetrics = {
  partErrors: number
  apiHandlerErrors: number
  partExecutions: number
  apiHandlerExecutions: number
  executionDurationSamples: number
}

interface InternalBaseMetrics {
  partErrors: number
  globalErrors: number
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
let lambda: Lambda
let client: Client
let startTime: Date
let endTime: Date
let commandBaseMetrics: CommandBaseMetrics
let readModelResolverBaseMetrics: ResolverBaseMetrics
let viewModelBaseMetrics: ViewModelBaseMetrics
let apiHandlerBaseMetrics: ApiHandlerBaseMetrics
let internalBaseMetrics: InternalBaseMetrics

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

const collectReadModelResolverBaseMetrics = async (): Promise<ResolverBaseMetrics> => {
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
    partExecutions,
    resolverExecutions,
    executionDurationSamples,
  }
}

const collectSingViewModelBaseMetrics = async (
  name: string,
  skipProjectionErrors = false
): Promise<SingleViewModelBaseMetrics> => {
  const [
    resolverErrors,
    resolverExecutions,
    resolverExecutionDurationSamples,
    projectionErrors,
  ] = await Promise.all([
    getMetricData({
      MetricName: 'Errors',
      Stat: 'Sum',
      Dimensions: createDimensions([
        `DeploymentId=${deploymentId}`,
        'Part=ViewModelResolver',
        `ViewModel=${name}`,
      ]),
    }),
    getMetricData({
      MetricName: 'Executions',
      Stat: 'Sum',
      Dimensions: createDimensions([
        `DeploymentId=${deploymentId}`,
        'Part=ViewModelResolver',
        `ViewModel=${name}`,
      ]),
    }),
    getMetricData({
      MetricName: 'Duration',
      Stat: 'SampleCount',
      Dimensions: createDimensions([
        `DeploymentId=${deploymentId}`,
        'Part=ViewModelResolver',
        `ViewModel=${name}`,
        'Label=Execution',
      ]),
    }),
    !skipProjectionErrors
      ? getMetricData({
          MetricName: 'Errors',
          Stat: 'Sum',
          Dimensions: createDimensions([
            `DeploymentId=${deploymentId}`,
            'Part=ViewModelProjection',
            `ViewModel=${name}`,
          ]),
        })
      : 0,
  ])

  return {
    resolverErrors,
    resolverExecutions,
    resolverExecutionDurationSamples,
    projectionErrors,
  }
}

const collectViewModelBaseMetrics = async (): Promise<ViewModelBaseMetrics> => {
  const [
    resolverPartErrors,
    resolverPartExecutions,
    projectionPartErrors,
    initFailed,
    resolverFailed,
    monitoring,
  ] = await Promise.all([
    getMetricData({
      MetricName: 'Errors',
      Stat: 'Sum',
      Dimensions: createDimensions([
        `DeploymentId=${deploymentId}`,
        'Part=ViewModelResolver',
      ]),
    }),
    getMetricData({
      MetricName: 'Executions',
      Stat: 'Sum',
      Dimensions: createDimensions([
        `DeploymentId=${deploymentId}`,
        'Part=ViewModelResolver',
      ]),
    }),
    getMetricData({
      MetricName: 'Errors',
      Stat: 'Sum',
      Dimensions: createDimensions([
        `DeploymentId=${deploymentId}`,
        'Part=ViewModelProjection',
      ]),
    }),
    collectSingViewModelBaseMetrics('init-failed-view-model'),
    collectSingViewModelBaseMetrics('resolver-failed-view-model', true),
    collectSingViewModelBaseMetrics('monitoring-view-model'),
  ])

  return {
    resolverPartErrors,
    resolverPartExecutions,
    projectionPartErrors,
    initFailed,
    monitoring,
    resolverFailed,
  }
}

const collectCommandBaseMetrics = async (): Promise<CommandBaseMetrics> => {
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

const collectApiHandlerBaseMetrics = async (): Promise<ApiHandlerBaseMetrics> => {
  const [
    partErrors,
    apiHandlerErrors,
    partExecutions,
    apiHandlerExecutions,
    executionDurationSamples,
  ] = await Promise.all([
    getMetricData({
      MetricName: 'Errors',
      Stat: 'Sum',
      Dimensions: createDimensions([
        `DeploymentId=${deploymentId}`,
        'Part=ApiHandler',
      ]),
    }),
    getMetricData({
      MetricName: 'Errors',
      Stat: 'Sum',
      Dimensions: createDimensions([
        `DeploymentId=${deploymentId}`,
        'Part=ApiHandler',
        'Path=/api/fail-api',
        'Method=GET',
      ]),
    }),
    getMetricData({
      MetricName: 'Executions',
      Stat: 'Sum',
      Dimensions: createDimensions([
        `DeploymentId=${deploymentId}`,
        'Part=ApiHandler',
      ]),
    }),
    getMetricData({
      MetricName: 'Executions',
      Stat: 'Sum',
      Dimensions: createDimensions([
        `DeploymentId=${deploymentId}`,
        'Part=ApiHandler',
        'Path=/api/fail-api',
        'Method=GET',
      ]),
    }),
    getMetricData({
      MetricName: 'Duration',
      Stat: 'SampleCount',
      Dimensions: createDimensions([
        `DeploymentId=${deploymentId}`,
        'Part=ApiHandler',
        'Path=/api/fail-api',
        'Method=GET',
        'Label=Execution',
      ]),
    }),
  ])

  return {
    partErrors,
    apiHandlerErrors,
    partExecutions,
    apiHandlerExecutions,
    executionDurationSamples,
  }
}

const collectInternalBaseMetrics = async (): Promise<InternalBaseMetrics> => {
  const [partErrors, globalErrors] = await Promise.all([
    getMetricData({
      MetricName: 'Errors',
      Stat: 'Sum',
      Dimensions: createDimensions([
        `DeploymentId=${deploymentId}`,
        'Part=Internal',
      ]),
    }),
    getMetricData({
      MetricName: 'Errors',
      Stat: 'Sum',
      Dimensions: createDimensions(['Part=Internal']),
    }),
  ])

  return {
    partErrors,
    globalErrors,
  }
}

beforeAll(async () => {
  deploymentId = process.env.RESOLVE_TESTS_TARGET_DEPLOYMENT_ID || ''
  cw = new CloudWatch({})
  lambda = new Lambda({})
  client = getClient()
  endTime = new Date(Date.now() + 3600000) // next hour
  startTime = new Date(Date.now() - 3600000 * 24 * 7) // previous day
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
  const dimensionString = metricData.Dimensions.map(
    (dim) => `${dim.Name}=${dim.Value}`
  ).join(';')

  if (!isEqual(metric, value)) {
    if (attempt >= maxAttempts) {
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

const getFunctionName = () => {
  const version = process.env.RESOLVE_TESTS_TARGET_VERSION
  const parsedVersion = parseVersion(version)

  if (parsedVersion == null) {
    throw new Error(`Parse version "${version}" failed`)
  }

  return [
    'app',
    deploymentId,
    process.env.RESOLVE_TESTS_TARGET_STAGE,
    parsedVersion.major,
    parsedVersion.minor,
    'x',
  ].join('-')
}

describe('Commands metrics', () => {
  beforeAll(async () => {
    commandBaseMetrics = await collectCommandBaseMetrics()
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

describe('Read Model Projection metrics', () => {
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

  test('read model event handler', async () => {
    await client.command({
      aggregateId: 'any',
      aggregateName: 'monitoring-aggregate',
      type: 'executeReadModelProjection',
      payload: {},
    })

    await client.command({
      aggregateId: 'any',
      aggregateName: 'monitoring-aggregate',
      type: 'failReadModelProjection',
      payload: {},
    })

    await awaitMetricValue(
      {
        MetricName: 'Duration',
        Stat: 'SampleCount',
        Dimensions: createDimensions([
          `DeploymentId=${deploymentId}`,
          'Part=ReadModelProjection',
          'ReadModel=monitoring',
          'Label=EventApply',
        ]),
      },
      1
    )

    await awaitMetricValue(
      {
        MetricName: 'Duration',
        Stat: 'SampleCount',
        Dimensions: createDimensions([
          `DeploymentId=${deploymentId}`,
          'Part=ReadModelProjection',
          'ReadModel=monitoring',
          'Label=EventProjectionApply',
        ]),
      },
      1
    )

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

describe('Read Model Resolver metrics', () => {
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

describe('View Model metrics', () => {
  beforeAll(async () => {
    viewModelBaseMetrics = await collectViewModelBaseMetrics()
  })

  test('view model resolver failed', async () => {
    await expect(
      client.query({
        name: 'resolver-failed-view-model',
        aggregateIds: ['test-aggregate'],
        args: {},
      })
    ).rejects.toBeInstanceOf(Error)

    viewModelBaseMetrics.resolverPartErrors++
    viewModelBaseMetrics.resolverPartExecutions++
    viewModelBaseMetrics.resolverFailed.resolverErrors++
    viewModelBaseMetrics.resolverFailed.resolverExecutions++
    viewModelBaseMetrics.resolverFailed.resolverExecutionDurationSamples++

    await awaitMetricValue(
      {
        MetricName: 'Errors',
        Stat: 'Sum',
        Dimensions: createDimensions([
          `DeploymentId=${deploymentId}`,
          'Part=ViewModelResolver',
          'ViewModel=resolver-failed-view-model',
        ]),
      },
      viewModelBaseMetrics.resolverFailed.resolverErrors
    )

    await awaitMetricValue(
      {
        MetricName: 'Errors',
        Stat: 'Sum',
        Dimensions: createDimensions([
          `DeploymentId=${deploymentId}`,
          'Part=ViewModelResolver',
        ]),
      },
      viewModelBaseMetrics.resolverPartErrors
    )

    await awaitMetricValue(
      {
        MetricName: 'Executions',
        Stat: 'Sum',
        Dimensions: createDimensions([
          `DeploymentId=${deploymentId}`,
          'Part=ViewModelResolver',
          'ViewModel=resolver-failed-view-model',
        ]),
      },
      viewModelBaseMetrics.resolverFailed.resolverExecutions
    )

    await awaitMetricValue(
      {
        MetricName: 'Executions',
        Stat: 'Sum',
        Dimensions: createDimensions([
          `DeploymentId=${deploymentId}`,
          'Part=ViewModelResolver',
        ]),
      },
      viewModelBaseMetrics.resolverPartExecutions
    )

    await awaitMetricValue(
      {
        MetricName: 'Duration',
        Stat: 'SampleCount',
        Dimensions: createDimensions([
          `DeploymentId=${deploymentId}`,
          'Part=ViewModelResolver',
          'ViewModel=resolver-failed-view-model',
          'Label=Execution',
        ]),
      },
      viewModelBaseMetrics.resolverFailed.resolverExecutionDurationSamples
    )
  })

  test('view model Init handler failed', async () => {
    await expect(
      client.query({
        name: 'init-failed-view-model',
        aggregateIds: ['test-aggregate'],
        args: {},
      })
    ).rejects.toThrowError()

    viewModelBaseMetrics.resolverPartErrors++
    viewModelBaseMetrics.resolverPartExecutions++
    viewModelBaseMetrics.projectionPartErrors++
    viewModelBaseMetrics.initFailed.resolverErrors++
    viewModelBaseMetrics.initFailed.resolverExecutions++
    viewModelBaseMetrics.initFailed.projectionErrors++

    await awaitMetricValue(
      {
        MetricName: 'Errors',
        Stat: 'Sum',
        Dimensions: createDimensions([
          `DeploymentId=${deploymentId}`,
          'Part=ViewModelResolver',
          'ViewModel=init-failed-view-model',
        ]),
      },
      viewModelBaseMetrics.initFailed.resolverErrors
    )

    await awaitMetricValue(
      {
        MetricName: 'Errors',
        Stat: 'Sum',
        Dimensions: createDimensions([
          `DeploymentId=${deploymentId}`,
          'Part=ViewModelProjection',
          'ViewModel=init-failed-view-model',
          'EventType=Init',
        ]),
      },
      viewModelBaseMetrics.initFailed.projectionErrors
    )

    await awaitMetricValue(
      {
        MetricName: 'Errors',
        Stat: 'Sum',
        Dimensions: createDimensions([
          `DeploymentId=${deploymentId}`,
          'Part=ViewModelProjection',
        ]),
      },
      viewModelBaseMetrics.projectionPartErrors
    )
  })

  test('view model event handler failed', async () => {
    await client.command({
      aggregateId: 'fail-aggregate',
      aggregateName: 'monitoring-aggregate',
      type: 'failViewModelProjection',
      payload: {},
    })

    await expect(
      client.query({
        name: 'monitoring-view-model',
        aggregateIds: ['fail-aggregate'],
        args: {},
      })
    ).rejects.toBeInstanceOf(Error)

    viewModelBaseMetrics.resolverPartErrors++
    viewModelBaseMetrics.resolverPartExecutions++
    viewModelBaseMetrics.projectionPartErrors++
    viewModelBaseMetrics.monitoring.resolverErrors++
    viewModelBaseMetrics.monitoring.resolverExecutions++
    viewModelBaseMetrics.monitoring.projectionErrors++
    viewModelBaseMetrics.monitoring.resolverExecutionDurationSamples++

    await awaitMetricValue(
      {
        MetricName: 'Errors',
        Stat: 'Sum',
        Dimensions: createDimensions([
          `DeploymentId=${deploymentId}`,
          'Part=ViewModelResolver',
          'ViewModel=monitoring-view-model',
        ]),
      },
      viewModelBaseMetrics.monitoring.resolverErrors
    )

    await awaitMetricValue(
      {
        MetricName: 'Errors',
        Stat: 'Sum',
        Dimensions: createDimensions([
          `DeploymentId=${deploymentId}`,
          'Part=ViewModelProjection',
          'ViewModel=monitoring-view-model',
          'EventType=MONITORING_VIEW_MODEL_FAILED',
        ]),
      },
      viewModelBaseMetrics.monitoring.projectionErrors
    )

    await awaitMetricValue(
      {
        MetricName: 'Errors',
        Stat: 'Sum',
        Dimensions: createDimensions([
          `DeploymentId=${deploymentId}`,
          'Part=ViewModelProjection',
        ]),
      },
      viewModelBaseMetrics.projectionPartErrors
    )
  })
})

describe('Api Handler metrics', () => {
  beforeAll(async () => {
    apiHandlerBaseMetrics = await collectApiHandlerBaseMetrics()
  })

  test('api handler failed', async () => {
    await fetch(`${getTargetURL()}/api/fail-api`)

    apiHandlerBaseMetrics.apiHandlerErrors++
    apiHandlerBaseMetrics.partErrors++
    apiHandlerBaseMetrics.apiHandlerExecutions++
    apiHandlerBaseMetrics.partExecutions++
    apiHandlerBaseMetrics.executionDurationSamples++

    await awaitMetricValue(
      {
        MetricName: 'Errors',
        Stat: 'Sum',
        Dimensions: createDimensions([
          `DeploymentId=${deploymentId}`,
          'Part=ApiHandler',
          'Path=/api/fail-api',
          'Method=GET',
        ]),
      },
      apiHandlerBaseMetrics.apiHandlerErrors
    )

    await awaitMetricValue(
      {
        MetricName: 'Errors',
        Stat: 'Sum',
        Dimensions: createDimensions([
          `DeploymentId=${deploymentId}`,
          'Part=ApiHandler',
        ]),
      },
      apiHandlerBaseMetrics.partErrors
    )

    await awaitMetricValue(
      {
        MetricName: 'Executions',
        Stat: 'Sum',
        Dimensions: createDimensions([
          `DeploymentId=${deploymentId}`,
          'Part=ApiHandler',
          'Path=/api/fail-api',
          'Method=GET',
        ]),
      },
      apiHandlerBaseMetrics.apiHandlerExecutions
    )

    await awaitMetricValue(
      {
        MetricName: 'Executions',
        Stat: 'Sum',
        Dimensions: createDimensions([
          `DeploymentId=${deploymentId}`,
          'Part=ApiHandler',
        ]),
      },
      apiHandlerBaseMetrics.partExecutions
    )

    await awaitMetricValue(
      {
        MetricName: 'Duration',
        Stat: 'SampleCount',
        Dimensions: createDimensions([
          `DeploymentId=${deploymentId}`,
          'Part=ApiHandler',
          'Path=/api/fail-api',
          'Method=GET',
          'Label=Execution',
        ]),
      },
      apiHandlerBaseMetrics.executionDurationSamples
    )
  })
})

describe('Internal metrics', () => {
  beforeAll(async () => {
    internalBaseMetrics = await collectInternalBaseMetrics()
  })

  test('collects errors thrown in lambda worker', async () => {
    const json = JSON.stringify({
      key: 'monitoring-test',
    })

    const payload = new Uint8Array(json.length)

    for (let i = 0; i < json.length; i++) {
      payload[i] = json.charCodeAt(i)
    }

    await lambda.invoke({
      FunctionName: getFunctionName(),
      Payload: payload,
    })

    internalBaseMetrics.partErrors++
    internalBaseMetrics.globalErrors++

    await awaitMetricValue(
      {
        MetricName: 'Errors',
        Stat: 'Sum',
        Dimensions: createDimensions([
          `DeploymentId=${deploymentId}`,
          'Part=Internal',
        ]),
      },
      internalBaseMetrics.partErrors
    )

    await awaitMetricValue(
      {
        MetricName: 'Errors',
        Stat: 'Sum',
        Dimensions: createDimensions(['Part=Internal']),
      },
      internalBaseMetrics.globalErrors
    )
  })
})

describe('Health Check', () => {
  test('returns isAlive true for all read models', async () => {
    const failedReadModels = ['init-failed', 'monitoring']
    const response = await fetch(`${getTargetURL()}/api/health-check`)

    for (const item of await response.json()) {
      const expectedIsAlive = !failedReadModels.includes(item.readModelName)
      expect(item.isAlive).toEqual(expectedIsAlive)
    }
  })
})
