const SAFE_API_HANDLER_TIMEOUT = 20 * 1000

const benchmarkApiHandler = async (req, res) => {
  const barrierTimestamp = Date.now() + SAFE_API_HANDLER_TIMEOUT
  while (Date.now() < barrierTimestamp) {
    try {
      await req.resolve.eventSubscriber.resume({
        eventSubscriber: 'benchmark-lite',
      })
      await req.resolve.eventSubscriber.resume({
        eventSubscriber: 'benchmark-heavy',
      })

      await res.json('ok')

      return
    } catch (e) {}
  }

  await res.json('error')
}

export default benchmarkApiHandler
