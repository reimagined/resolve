const build = async (pool, ...args) =>
  pool.fastLedgerMode
    ? await pool.buildFast(pool, ...args)
    : await pool.buildSlow(pool, ...args)

export default build
