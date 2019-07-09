const onResumeListenerTopic = async (pool, content) => {
  const { listenerId } = JSON.parse(content)
  await pool.updateListenerInfo(listenerId, { Status: 'running' })
  await pool.followTopic(pool, listenerId)
}

export default onResumeListenerTopic
