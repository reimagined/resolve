const dispose = async ({ connection }) => {
  await connection.end()
}

export default dispose
