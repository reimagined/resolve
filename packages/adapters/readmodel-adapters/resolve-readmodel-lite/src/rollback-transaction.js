const rollbackTransaction = async ({ runQuery }) => {
  await runQuery(`ROLLBACK;`)
}

export default rollbackTransaction
