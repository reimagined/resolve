import fetch from 'isomorphic-fetch'
import { getTargetURL } from '../utils/utils'

const BENCH_EVENTS_COUNT = 100000
const MAX_FAILED_ATTEMPTS = 5

const getEventCount = async (benchType: 'lite' | 'heavy') => {
  try {
    const request = await fetch(
      `${getTargetURL()}/api/query/benchmark-${benchType}/countBenchEvents`
    )
    const response = await request.json()
    return +response.data
  } catch (e) {
    return -1
  }
}
const generateEvents = async () => {
  try {
    const request = await fetch(`${getTargetURL()}/api/generate-bench-events`, {
      method: 'POST',
    })
    const response = await request.json()
    return +response
  } catch (e) {
    return 0
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
      await Promise.all(Array.from({ length: 20 }).map(generateEvents))
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

  expect(liteEventsCount).toBeGreaterThanOrEqual(generatedBenchEventsCount)
  expect(heavyEventsCount).toBeGreaterThanOrEqual(generatedBenchEventsCount)
})
