const onEvent = async ({ handlers }, event) => {
  await Promise.resolve()
  await Promise.all(
    Array.from(handlers).map(
      handler => handler(event)
    )
  )
}

export default onEvent
