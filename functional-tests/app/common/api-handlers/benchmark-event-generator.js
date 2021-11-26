const SAFE_API_HANDLER_TIMEOUT = 20 * 1000
const generateString = () =>
  `${Date.now()}${Math.floor(Math.random() * 1000000000)}`

const generatePayload = (level) => ({
  ...(level > 0 ? { nested: generatePayload(level - 1) } : {}),
  plain: generateString(),
})
const getExponentialDistributedInteger = (average) =>
  Math.floor(Math.log(1 - Math.random()) / (-1 / average))

const emptyFunc = Promise.resolve.bind(Promise)
const INITIAL_VALUE = 1

const executeAsyncNoEmitError = (mainFunc, afterFunc) =>
  Promise.resolve()
    .then(mainFunc)
    .then(typeof afterFunc === 'function' ? afterFunc : emptyFunc)
    .catch(emptyFunc)

const benchmarkApiHandler = async (req, res) => {
  const barrierTimestamp = Date.now() + SAFE_API_HANDLER_TIMEOUT
  let savedEventsCount = 0
  const increaseEventsCount = () => savedEventsCount++
  while (Date.now() < barrierTimestamp) {
    executeAsyncNoEmitError(
      req.resolve.eventstoreAdapter.saveEvent.bind(null, {
        aggregateId: generateString(),
        aggregateVersion: INITIAL_VALUE,
        payload: generatePayload(getExponentialDistributedInteger(100)),
        type: 'BENCH_EVENT',
        timestamp: INITIAL_VALUE,
      }),
      increaseEventsCount
    )

    await new Promise(setImmediate)
  }

  await res.json(savedEventsCount)
}

export default benchmarkApiHandler
