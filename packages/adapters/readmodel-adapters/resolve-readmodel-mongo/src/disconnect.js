const disconnect = async ({ connection }) => {
  await connection.close()
}

export default disconnect
