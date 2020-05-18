const init = async pool => {
  return await pool.createDatabase(pool)
}

export default init
