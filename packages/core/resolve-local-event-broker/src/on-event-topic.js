const onEventTopic = async pool => {
  const promises = []
  for (const listenerId of pool.clientMap.keys()) {
    promises.push(pool.followTopic(pool, listenerId))
  }

  return await Promise.all(promises)
}

export default onEventTopic
