const onPauseListenerTopic = async (pool, content) => {
  const { listenerId } = JSON.parse(content)
  await pool.updateListenerInfo(listenerId, { Status: 'paused' })
}

export default onPauseListenerTopic
