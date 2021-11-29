import { CloudWatch, Dimension } from '@aws-sdk/client-cloudwatch'
import fetch from 'isomorphic-fetch'
import { getTargetURL } from '../utils/utils'

jest.setTimeout(10 * 60 * 1000)

const BENCH_EVENTS_COUNT = 7000
const MAX_FAILED_ATTEMPTS = 5
const PERIOD = 60 //seconds
let testLaunchTimestamp = Number.NaN

const CURRENT_METRIC_ID = 'current_metric_id'

const getOneMetricSummaryData = async (params: {
  Region: string
  StartTime: number
  EndTime: number
  Dimensions: Dimension[]
  MetricName: string
  Namespace: string
  Period: number
}): Promise<Map<number, number> | null> => {
  const {
    Region,
    StartTime,
    EndTime,
    Dimensions,
    MetricName,
    Namespace,
    Period,
  } = params
  const cw = new CloudWatch({ region: Region })

  try {
    let NextToken: string | undefined
    const result = new Map<number, number>()

    do {
      const {
        MetricDataResults,
        NextToken: CurrentNextToken,
      } = await cw.getMetricData({
        ScanBy: 'TimestampAscending',
        StartTime: new Date(StartTime),
        EndTime: new Date(EndTime),
        MetricDataQueries: [
          {
            Id: CURRENT_METRIC_ID,
            MetricStat: {
              Metric: {
                Dimensions,
                MetricName,
                Namespace,
              },
              Stat: 'Average',
              Period,
            },
            ReturnData: true,
          },
        ],
        NextToken,
      })

      const { Timestamps = [], Values = [] } = (MetricDataResults ?? []).find(
        (e) => e.Id === CURRENT_METRIC_ID
      ) ?? { Timestamps: [], Values: [] }

      if (Timestamps.length === 0) {
        break
      }

      for (let index = 0; index < Timestamps.length; index++) {
        result.set(Timestamps[index].valueOf(), Values[index])
      }

      NextToken = CurrentNextToken
    } while (NextToken != null)

    if (result.size > 0) {
      return result
    } else {
      return null
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
    throw e
  }
}

const CHECK_NOT_NULLISH = <T extends unknown>(e: T) => {
  expect(e).not.toBeUndefined()
  expect(e).not.toBeNull()
  return e as Exclude<Exclude<T, null>, undefined>
}

const getReadModelFeedingRateMetric = async (readModelName: string) => {
  const result = await getOneMetricSummaryData({
    Region: CHECK_NOT_NULLISH(process.env.AWS_REGION),
    StartTime: testLaunchTimestamp - 60000, // launch test time minus one minute
    EndTime: Date.now() + 60000, // next minute
    MetricName: 'ReadModelFeedingRate',
    Namespace: 'ResolveJs',
    Period: PERIOD,
    Dimensions: [
      {
        Name: 'DeploymentId',
        Value: CHECK_NOT_NULLISH(
          process.env.RESOLVE_TESTS_TARGET_DEPLOYMENT_ID
        ),
      },
      { Name: 'Part', Value: 'ReadModelProjection' },
      { Name: 'ReadModel', Value: readModelName },
    ],
  })

  return result
}

const isHighloadError = (error: Error) =>
  error != null &&
  /(?:HTTP ERROR 503)|(?:ETIMEDOUT)|(?:ECONNRESET)/.test(error.message)

const performApiPost = async <T extends unknown, Args extends [string, T?]>(
  ...args: Args
) => {
  while (true) {
    try {
      const request = await fetch(`${getTargetURL()}/api${args[0]}`, {
        method: 'POST',
      })
      if (request.status === 503) {
        throw new Error('HTTP ERROR 503')
      }
      const response = await request.json()
      return response
    } catch (error) {
      if (!isHighloadError(error)) {
        // eslint-disable-next-line no-console
        console.error(error)
        if (args.length === 1) {
          throw error
        } else {
          return args[1]
        }
      }
    }
  }
}

const getEventCount = async (benchType: 'lite' | 'heavy') => {
  return +(
    await performApiPost(`/query/benchmark-${benchType}/countBenchEvents`, {
      data: -1,
    })
  ).data
}

const pauseReadModels = async (dropBenchEventstore: boolean): Promise<null> => {
  const result = await performApiPost(
    `/bench-read-models-pause${
      dropBenchEventstore ? '?dropBenchEventstore=true' : ''
    }`,
    null
  )
  if (result === 'error') {
    return await pauseReadModels(dropBenchEventstore)
  } else if (result !== 'ok') {
    throw new Error(`Failed pause read models: ${result}`)
  } else {
    return null
  }
}

const generateEvents = async () => {
  return +(await performApiPost(`/generate-bench-events`, 0))
}

const resumeReadModels = async (): Promise<null> => {
  const result = await performApiPost(`/bench-read-models-resume`, null)
  if (result === 'error') {
    return await resumeReadModels()
  } else if (result !== 'ok') {
    throw new Error(`Failed resume read models: ${result}`)
  } else {
    return null
  }
}

const jitterDelay = (attempt: number) =>
  new Promise((resolve) =>
    setTimeout(
      resolve,
      Math.min(Math.floor(Math.pow(2, attempt) * 1000), 100000)
    )
  )

test('benchmark', async () => {
  testLaunchTimestamp = Date.now()
  await pauseReadModels(!!process.env.DROP_BENCH_EVENT_STORE)

  let [liteEventsCount, heavyEventsCount] = await Promise.all([
    getEventCount('lite'),
    getEventCount('heavy'),
  ])
  expect(liteEventsCount).toEqual(0)
  expect(heavyEventsCount).toEqual(0)

  let generatedBenchEventsCount = 0
  let failedAttempts = 0
  while (generatedBenchEventsCount < BENCH_EVENTS_COUNT) {
    const currentGeneratedEvents = (
      await Promise.all(Array.from({ length: 30 }).map(generateEvents))
    ).reduce((acc, val) => acc + val, 0)
    generatedBenchEventsCount += currentGeneratedEvents
    if (currentGeneratedEvents === 0) {
      await jitterDelay(failedAttempts)
      failedAttempts++
    } else {
      failedAttempts = 0
    }

    expect(failedAttempts).toBeLessThan(MAX_FAILED_ATTEMPTS)
  }

  await resumeReadModels()

  try {
    while (
      liteEventsCount < generatedBenchEventsCount ||
      heavyEventsCount < generatedBenchEventsCount
    ) {
      const [
        currentLiteEventsCount,
        currentHeavyEventsCount,
      ] = await Promise.all([getEventCount('lite'), getEventCount('heavy')])
      if (
        currentLiteEventsCount <= liteEventsCount &&
        currentHeavyEventsCount <= heavyEventsCount
      ) {
        await jitterDelay(failedAttempts)
        failedAttempts++
      } else {
        failedAttempts = 0
      }

      liteEventsCount = currentLiteEventsCount
      heavyEventsCount = currentHeavyEventsCount

      expect(failedAttempts).toBeLessThan(MAX_FAILED_ATTEMPTS)
    }
  } finally {
    await pauseReadModels(false)
  }

  expect(liteEventsCount).toBeGreaterThanOrEqual(generatedBenchEventsCount)
  expect(heavyEventsCount).toBeGreaterThanOrEqual(generatedBenchEventsCount)

  const benchLiteFeedingRate = CHECK_NOT_NULLISH(
    await getReadModelFeedingRateMetric('benchmark-lite')
  )

  const benchHeavyFeedingRate = CHECK_NOT_NULLISH(
    await getReadModelFeedingRateMetric('benchmark-heavy')
  )

  const resultLite =
    [...benchLiteFeedingRate.entries()]
      .map(([_, rate]) => rate)
      .reduce((acc, val) => acc + val, 0) / benchLiteFeedingRate.size
  const resultHeavy =
    [...benchHeavyFeedingRate.entries()]
      .map(([_, rate]) => rate)
      .reduce((acc, val) => acc + val, 0) / benchHeavyFeedingRate.size

  // eslint-disable-next-line no-console
  console.log('resultLite', resultLite)
  // eslint-disable-next-line no-console
  console.log('resultHeavy', resultHeavy)

  // Minimum 400 events/sec for lite read-model projection with cold restart
  expect(resultLite).toBeGreaterThan(400)

  // Minimum 160 events/sec for heavy read-model projection with cold restart
  expect(resultHeavy).toBeGreaterThan(160)
})
