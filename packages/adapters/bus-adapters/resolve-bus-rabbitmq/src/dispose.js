const dispose = async pool => {
  pool.disposed = true
  pool.handlers.clear()

  await new Promise((resolve, reject) =>
    pool.connection.close(error => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
  )
}

export default dispose
