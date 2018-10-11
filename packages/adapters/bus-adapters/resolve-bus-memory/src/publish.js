const publish = async (pool, event) => {
  if (pool.disposed) {
    throw new Error('Adapter has been already disposed')
  }
  await Promise.resolve()
  try {
    await Promise.all(Array.from(pool.handlers).map(handler => handler(event)))
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error)
  }
}

export default publish
