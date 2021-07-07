const shutdownOne = async ({
  eventSubscriberScope,
  name,
  eventstoreAdapter,
  eventSubscriber,
  upstream,
  deleteQueue,
}) => {
  try {
    const errors = []
    try {
      if (upstream) {
        await eventSubscriber.pause({ eventSubscriber: name })
      }

      await eventSubscriber.unsubscribe({ eventSubscriber: name })
    } catch (err) {
      errors.push(err)
    }

    try {
      await eventstoreAdapter.removeEventSubscriber({
        applicationName: eventSubscriberScope,
        eventSubscriber: name,
      })
    } catch (err) {
      errors.push(err)
    }

    try {
      await deleteQueue(name)
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
      Event subscriber "${name}" can't stop subscription due to error "${error}"
    `)
  }
}

export default shutdownOne
