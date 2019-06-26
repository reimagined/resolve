const beginTransaction = async ({ runRawQuery }) => {
  try {
    await runRawQuery(`ROLLBACK;`)
  } catch (error) {}

  await runRawQuery(`START TRANSACTION;`)
}

export default beginTransaction
