const wrapReadmodelConnector = (connector, options) => {
  const wrappedConnector = Object.create(connector)

  if (typeof connector.connect !== 'function') {
    Object.defineProperty(wrappedConnector, 'connect', {
      value: async () => options
    })
  }
  if (typeof connector.disconnect !== 'function') {
    Object.defineProperty(wrappedConnector, 'disconnect', {
      value: async () => {}
    })
  }
  if (typeof connector.drop !== 'function') {
    Object.defineProperty(wrappedConnector, 'drop', {
      value: async () => {}
    })
  }
  if (typeof connector.dispose !== 'function') {
    Object.defineProperty(wrappedConnector, 'dispose', {
      value: async () => {}
    })
  }

  return wrappedConnector
}

export default wrapReadmodelConnector
