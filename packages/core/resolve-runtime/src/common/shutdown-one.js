const shutdownOne = async ({ eventBus, eventSubscriber, upstream }) => {
  try {
    if (upstream) {
      await eventBus.pause({ eventSubscriber });
    }

    await eventBus.unsubscribe({ eventSubscriber });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(`
      Event listener "${eventSubscriber}" can't stop subscription since event bus
      cannot initiate notification for it because of error "${error}"
    `);
  }
};

export default shutdownOne;
