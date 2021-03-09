const wrapSaveEvent = (saveEvent: any) => async (
  pool: any,
  ...args: any
): Promise<any> => {
  if (typeof pool.isFrozen === 'function' && (await pool.isFrozen())) {
    throw new Error('Event store is frozen')
  }
  return await saveEvent(pool, ...args)
}

export default wrapSaveEvent
