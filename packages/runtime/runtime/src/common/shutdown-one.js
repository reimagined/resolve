const shutdownOne = async ({ eventBus, eventSubscriber, upstream }) => {
  try {
    if (upstream) {
      await eventBus.pause({ eventSubscriber })
    }

    await eventBus.unsubscribe({ eventSubscriber })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(`
      Event listener "${eventSubscriber}" cannot unsubscribe - event bus
      is unable to notify the listener due to an error "${error}"
    `)
  }
}

export default shutdownOne
