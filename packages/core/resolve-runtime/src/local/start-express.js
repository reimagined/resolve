const host = '0.0.0.0'
const startExpress = async ({ port, server }) => {
  await new Promise((resolve, reject) =>
    server.listen(port, host, error => (error ? reject(error) : resolve()))
  )

  server.on('error', err => {
    throw err
  })
}

export default startExpress
