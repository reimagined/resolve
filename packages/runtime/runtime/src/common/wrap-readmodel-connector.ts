const wrapReadmodelConnector = (connector: any, options: any) => {
  const wrappedConnector = Object.create(connector)

  if (typeof connector.connect !== 'function') {
    Object.defineProperty(wrappedConnector, 'connect', {
      value: async () => options,
    })
  }
  if (typeof connector.disconnect !== 'function') {
    Object.defineProperty(wrappedConnector, 'disconnect', {
      value: async () => {
        return
      },
    })
  }
  if (typeof connector.drop !== 'function') {
    Object.defineProperty(wrappedConnector, 'drop', {
      value: async () => {
        return
      },
    })
  }
  if (typeof connector.dispose !== 'function') {
    Object.defineProperty(wrappedConnector, 'dispose', {
      value: async () => {
        return
      },
    })
  }

  return wrappedConnector
}

export default wrapReadmodelConnector
