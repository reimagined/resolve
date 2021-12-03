const SAFE_API_HANDLER_TIMEOUT = 20 * 1000
const generateString = () =>
  `${Date.now()}${Math.floor(Math.random() * 1000000000)}`

const generatePayload = (level) => ({
  ...(level > 0 ? { nested: generatePayload(level - 1) } : {}),
  plain: generateString(),
})
const getExponentialDistributedInteger = (average) =>
  Math.floor(Math.log(1 - Math.random()) / (-1 / average))

const INITIAL_VALUE = 1

const benchmarkApiHandler = async (req, res) => {
  const barrierTimestamp = Date.now() + SAFE_API_HANDLER_TIMEOUT
  let savedEventsCount = 0
  while (Date.now() < barrierTimestamp) {
    try {
      await req.resolve.eventstoreAdapter.saveEvent({
        aggregateId: generateString(),
        aggregateVersion: INITIAL_VALUE,
        payload: generatePayload(getExponentialDistributedInteger(100)),
        type: 'BENCH_EVENT',
        timestamp: INITIAL_VALUE,
      })
      savedEventsCount++
    } catch (e) {}
  }

  await res.json(savedEventsCount)
}

export default benchmarkApiHandler
