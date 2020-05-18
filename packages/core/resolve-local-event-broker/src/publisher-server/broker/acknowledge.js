const acknowledge = async (pool, batchId, result) => {
  return await pool.acknowledgeBatch(pool, batchId, result)
}

export default acknowledge
