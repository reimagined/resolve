const processResetListenerAcknowledge = async (pool, content) => {
  const { messageGuid, ...resetStatus } = JSON.parse(content)
  const resolver = pool.resetListenersPromises.get(messageGuid)
  resolver(resetStatus)
}

export default processResetListenerAcknowledge
