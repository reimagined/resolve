const wrapSaveEvent = saveEvent => async (pool, ...args) => {
  if (typeof pool.isFrozen === 'function' && (await pool.isFrozen())) {
    throw new Error('Event store is frozen')
  }
  return await saveEvent(pool, ...args)
}

export default wrapSaveEvent
