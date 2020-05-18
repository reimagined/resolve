const drop = async pool => {
  return await pool.dropDatabase(pool)
}

export default drop
