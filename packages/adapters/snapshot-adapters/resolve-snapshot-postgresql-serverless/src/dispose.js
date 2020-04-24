const dispose = async pool => {
  if (pool.counters != null) {
    pool.counters.clear()
  }
}

export default dispose
