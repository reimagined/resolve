const bootstrapOne = async ({
  applicationName,
  name,
  eventstoreAdapter,
  eventSubscriber,
  eventTypes,
  destination,
  upstream,
}) => {
  try {
    await eventstoreAdapter.ensureEventSubscriber({
      applicationName,
      eventSubscriber: name,
      destination,
      status: { eventTypes },
    })

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
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(`
      Event subscriber "${name}" can't resume subscription because of error "${error.stack}"
    `)
  }
}

export default bootstrapOne
