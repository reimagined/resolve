const beginTransaction = async ({ runQuery }) => {
  try {
    await runQuery(`ROLLBACK;`)
  } catch (error) {}

  await runQuery(`START TRANSACTION;`)
}

export default beginTransaction
