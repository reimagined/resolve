const dispose = async ({ client }) => {
  await client.close()
}

export default dispose
