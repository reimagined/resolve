const invokeConsumer = async (pool, method, payload, isAsync) => {
  const { consumer, multiplexAsync } = pool
  if (method == null) {
    throw new Error(
      `Invalid invoke consumer method "${method}" with payload: ${JSON.stringify(
        payload
      )}`
    )
  } else if (isAsync) {
    return await multiplexAsync(consumer[method].bind(consumer), payload)
  } else {
    return await consumer[method](payload)
  }
}

export default invokeConsumer
