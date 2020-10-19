const createEventBusConsumer = (resolve) => {
  const eventBusConsumer = new Proxy(
    {},
    {
      get(_, key) {
        switch (key) {
          case 'BeginXATransaction':
          case 'CommitXATransaction':
          case 'RollbackXATransaction':
          case 'Drop':
          case 'SendEvents':
            return resolve.eventListener[key]
          case 'LoadEvents':
          case 'SaveEvent':
            return resolve.eventStore[key]
          default: {
            throw new Error(`Invalid key ${key}`)
          }
        }
      },
      set() {
        throw new Error(`Event bus consumer API is immutable`)
      },
    }
  )

  return eventBusConsumer
}

export default createEventBusConsumer
