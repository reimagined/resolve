const shutdownOne = async ({
  applicationName,
  name,
  eventstoreAdapter,
  eventSubscriber,
  upstream,
}) => {
  try {
    if (upstream) {
      await eventSubscriber.pause({ eventSubscriber: name })
    }

    await eventSubscriber.unsubscribe({ eventSubscriber: name })

    await eventstoreAdapter.removeEventSubscriber({
      applicationName,
      eventSubscriber: name,
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(`
      Event subscriber "${name}" can't stop subscription due to error "${error}"
    `)
  }
}

export default shutdownOne
