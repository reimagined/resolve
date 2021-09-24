const bootstrapOne = async ({
  applicationName,
  name,
  eventstoreAdapter,
  eventSubscriber,
  eventTypes,
  destination,
  upstream,
  ensureQueue,
}) => {
  try {
    const errors = []
    try {
      await ensureQueue(name)
    } catch (err) {
      errors.push(err)
    }

    try {
      await eventstoreAdapter.ensureEventSubscriber({
        applicationName,
        eventSubscriber: name,
        status: null,
        destination,
      })
    } catch (err) {
      errors.push(err)
    }

    try {
      await eventSubscriber.subscribe({
        eventSubscriber: name,
        subscriptionOptions: { eventTypes },
      })

      if (upstream) {
        const sideEffectsKey = 'RESOLVE_SIDE_EFFECTS_START_TIMESTAMP'
        const [status, sideEffectsValue] = await Promise.all([
          eventSubscriber
            .status({ eventSubscriber: name })
            .then((result) => (result != null ? result.status : result)),
          eventSubscriber.getProperty({
            eventSubscriber: name,
            key: sideEffectsKey,
          }),
        ])

        if (sideEffectsValue == null || sideEffectsValue === '') {
          await eventSubscriber.setProperty({
            eventSubscriber: name,
            key: sideEffectsKey,
            value: `${Date.now()}`,
          })
        }

        if (status === 'deliver') {
          await eventSubscriber.resume({ eventSubscriber: name })
        }
      }
    } catch (err) {
      errors.push(err)
    }

    if (errors.length > 0) {
      const summaryError = new Error(
        errors.map(({ message }) => message).join('\n')
      )
      summaryError.stack = errors.map(({ stack }) => stack).join('\n')
      throw summaryError
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(`
      Event subscriber "${name}" can't resume subscription due to error "${error.stack}"
    `)
  }
}

export default bootstrapOne