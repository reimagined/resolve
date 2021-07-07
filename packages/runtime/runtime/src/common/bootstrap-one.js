const bootstrapOne = async ({
  eventSubscriberScope,
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
        applicationName: eventSubscriberScope,
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
        await eventSubscriber.setProperty({
          eventSubscriber: name,
          key: 'RESOLVE_SIDE_EFFECTS_START_TIMESTAMP',
          value: `${Date.now()}`,
        })

        await eventSubscriber.resume({ eventSubscriber: name })
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
