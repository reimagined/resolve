function wrapSaveEvent(saveEvent:Function) {
  return async function (pool: any, ...args: Array<any>) {
    if (typeof pool.isFrozen === 'function' && (await pool.isFrozen())) {
      throw new Error('Event store is frozen')
    }
    return await saveEvent(pool, ...args)
  }
}

export default wrapSaveEvent
