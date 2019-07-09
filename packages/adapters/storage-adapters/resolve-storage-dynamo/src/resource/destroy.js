const destroy = async ({ createAdapter }, options) => {
  const dynamoAdapter = createAdapter({
    ...options,
    skipInit: true
  })
  await dynamoAdapter.drop() // delete table
}

export default destroy
