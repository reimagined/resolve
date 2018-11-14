const destroy = async ({ createAdapter }, options) => {
  const dynamoAdapter = createAdapter({
    ...options,
    skipInit: true
  })
  await dynamoAdapter.dispose({ dropEvents: true }) // delete table
}

export default destroy
