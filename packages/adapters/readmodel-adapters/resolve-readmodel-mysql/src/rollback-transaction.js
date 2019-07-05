const rollbackTransaction = async ({ runRawQuery }) => {
  await runRawQuery(`ROLLBACK;`)
}

export default rollbackTransaction
