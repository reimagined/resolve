const host = '0.0.0.0'
const startExpress = async ({ port, server }) => {
  await new Promise((resolve, reject) =>
    server.listen(port, host, error => {
      if (error) {
        return reject(error)
      }
      // eslint-disable-next-line no-console
      console.log(`Application listening on port ${port}!`)
      return resolve()
    })
  )

  server.on('error', err => {
    throw err
  })
}

export default startExpress
