const beginTransaction = async ({ runQuery }) => {
  try {
    await runQuery(`ROLLBACK;`, true)
  } catch (error) {}

  await runQuery(`BEGIN IMMEDIATE;`, true)
}

export default beginTransaction
