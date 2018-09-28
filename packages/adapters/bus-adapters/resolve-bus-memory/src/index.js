const createAdapter = () => {
  let disposed = false
  
  const handlers = new Set()
  
  return {
    subscribe: async handler => {
      if(disposed) {
        throw new Error('Adapter has been already disposed')
      }
      handlers.add(handler)
      return () => handlers.delete(handler)
    },
    publish: async event => {
      if(disposed) {
        throw new Error('Adapter has been already disposed')
      }
      await Promise.resolve()
      await Promise.all(
        Array.from(handlers).map(
          handler => handler(event)
        )
      )
    },
    dispose: async () => {
      disposed = true
      handlers.clear()
    }
  }
}

export default createAdapter
