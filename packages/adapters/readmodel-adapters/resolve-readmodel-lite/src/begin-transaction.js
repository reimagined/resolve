const beginTransaction = async ({ runRawQuery }) => {
  try {
    await runRawQuery(`ROLLBACK;`)
  } catch (error) {}

  await runRawQuery(`BEGIN IMMEDIATE;`)
}

export default beginTransaction
