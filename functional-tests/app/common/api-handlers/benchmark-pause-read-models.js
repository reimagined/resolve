const SAFE_API_HANDLER_TIMEOUT = 20 * 1000

const benchmarkApiHandler = async (req, res) => {
  const barrierTimestamp = Date.now() + SAFE_API_HANDLER_TIMEOUT
  const dropBenchEventstore = !!req.query.dropBenchEventstore
  while (Date.now() < barrierTimestamp) {
    try {
      if (dropBenchEventstore) {
        try {
          await req.resolve.eventstoreAdapter.drop()
        } catch (e) {}
        await req.resolve.eventstoreAdapter.init()
      }

      for (const name of ['benchmark-lite', 'benchmark-heavy']) {
        await req.resolve.eventSubscriber.unsubscribe({ eventSubscriber: name })
        const { eventTypes } = req.resolve.eventListeners.get(name)
        await req.resolve.eventSubscriber.subscribe({
          eventSubscriber: name,
          subscriptionOptions: { eventTypes },
        })

        await req.resolve.eventSubscriber.resume({ eventSubscriber: name })
        while (true) {
          const {
            successEvent,
            failedEvent,
            errors,
            status,
          } = await req.resolve.eventSubscriber.status({
            eventSubscriber: name,
          })
          if (
            successEvent != null ||
            failedEvent != null ||
            (Array.isArray(errors) && errors.length > 0) ||
            status !== 'deliver'
          ) {
            break
          }
        }

        await req.resolve.eventSubscriber.pause({ eventSubscriber: name })
      }

      await res.json('ok')

      return
    } catch (e) {}
  }

  await res.json('error')
}

export default benchmarkApiHandler
