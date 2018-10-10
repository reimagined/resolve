const dispose = async pool => {
  pool.disposed = true
  pool.handlers.clear()
}

export default dispose
