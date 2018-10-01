const createAdapter = () => {
  let disposed = false

  const handlers = new Set()

  return {
    subscribe: async handler => {
      if (disposed) {
        throw new Error('Adapter has been already disposed')
      }
      handlers.add(handler)
      return () => handlers.delete(handler)
    },
    publish: async event => {
      if (disposed) {
        throw new Error('Adapter has been already disposed')
      }
      await Promise.resolve()
      try {
        await Promise.all(Array.from(handlers).map(handler => handler(event)))
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error)
      }
    },
    dispose: async () => {
      disposed = true
      handlers.clear()
    }
  }
}

export default createAdapter
