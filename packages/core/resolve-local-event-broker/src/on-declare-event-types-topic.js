const onDeclareEventTypesTopic = async (pool, content) => {
  const { listenerId, eventTypes } = JSON.parse(content)
  pool.localEventTypesMap.set(listenerId, eventTypes)
}

export default onDeclareEventTypesTopic
