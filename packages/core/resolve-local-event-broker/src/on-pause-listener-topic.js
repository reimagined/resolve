const onPauseListenerTopic = async (pool, content) => {
  const { listenerId } = JSON.parse(content)
  await pool.meta.updateListenerInfo(listenerId, { Status: 'paused' })
}

export default onPauseListenerTopic
