const resetReadModel = async (
  createConnector,
  connectorOptions,
  readModelName
) => {
  const adapter = createConnector(connectorOptions)
  try {
    const connection = await adapter.connect(readModelName)
    await adapter.drop(connection, readModelName)
    await adapter.disconnect(connection, readModelName)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(error)
  } finally {
    await adapter.dispose()
  }
}

export default resetReadModel
