import { BATCH_STEP_RESULT, LOCK_PROMISE_BASE_NAME } from '../constants'

const followTopic = async (pool, listenerId) => {
  const lockName = `${LOCK_PROMISE_BASE_NAME}${listenerId}`
  const unlock = await pool.interlockPromise(pool, lockName)

  try {
    while (
      (await pool.followTopicBatchStep(pool, listenerId)) ===
      BATCH_STEP_RESULT.CONTINUE
    ) {}
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Error while transmitting events for listener', error)
  }

  unlock()
}

export default followTopic
